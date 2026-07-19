// Online Live Battle — data layer (host TV + private player phones).
//
// This replaces the old local shared-screen battle (BattleSetup/BattleArena,
// removed) as the app's real multiplayer mode. It talks to the existing
// rooms/room_players/room_questions/answers/profiles tables plus the new
// secure RPCs added in supabase/migrations/20260719_online_live_battle.sql
// (submit_answer, resolve_round, advance_phase, start_battle,
// get_room_question) — scoring and phase transitions are never computed or
// trusted client-side; this module only ever asks the database to do them.
import { createClient } from "@/lib/supabase/client";
import type { LangCode } from "@/lib/i18n/locales";
import type { CategoryId } from "@/lib/categories";
import { loadQuestionsForLevel } from "@/lib/questions/loadQuestions";
import { questionsForLevel } from "@/lib/questions";

export type RoomPhase = "waiting" | "countdown" | "question" | "reveal" | "leaderboard" | "finished";

export const ROUND_SECONDS = 15;
export const COUNTDOWN_SECONDS = 3;
export const REVEAL_SECONDS = 5;
export const LEADERBOARD_SECONDS = 4;
/** A player not heard from in this long is shown as disconnected. */
export const PRESENCE_TIMEOUT_MS = 20000;
const HEARTBEAT_INTERVAL_MS = 8000;

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  status: RoomPhase;
  currentQuestion: number;
  questionCount: number;
  language: LangCode;
  categoryId: CategoryId;
  gameLevel: number;
  maxPlayers: number;
  questionStartedAt: string | null;
  questionEndsAt: string | null;
}

export interface RoomPlayerState {
  id: string;
  playerId: string;
  displayName: string;
  score: number;
  isReady: boolean;
  currentStreak: number;
  lastSeenAt: string;
  joinedAt: string;
}

export interface RoomQuestionView {
  roomQuestionId: string;
  questionNumber: number;
  reference: string;
  questionText: string;
  choices: [string, string, string, string];
  correctIndex: number | null;
  explanation: string | null;
}

export class RoomError extends Error {
  code: "ROOM_NOT_FOUND" | "ROOM_STARTED" | "ROOM_FULL" | "GENERIC";
  constructor(code: RoomError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function generateRoomCode(length = 6): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
}

export function isConnected(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < PRESENCE_TIMEOUT_MS;
}

export async function ensureAnonymousSession(): Promise<{ supabase: ReturnType<typeof createClient>; userId: string }> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (user) return { supabase, userId: user.id };
  if (error) console.info("No current guest session:", error.message);

  const { data, error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) throw signInError;
  if (!data.user) throw new Error("Unable to create guest player.");
  return { supabase, userId: data.user.id };
}

export async function ensurePlayerProfile(
  name: string,
  language: LangCode
): Promise<{ supabase: ReturnType<typeof createClient>; userId: string }> {
  const { supabase, userId } = await ensureAnonymousSession();
  const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: name, language }, { onConflict: "id" });
  if (error) throw error;
  if (typeof window !== "undefined") window.localStorage.setItem("menorah-player-name", name);
  return { supabase, userId };
}

export function getSavedPlayerName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("menorah-player-name") ?? "";
}

export async function createBattleRoom({
  hostName,
  categoryId,
  level,
  language,
  maxPlayers = 12,
  questionCount = 10,
}: {
  hostName: string;
  categoryId: CategoryId;
  level: number;
  language: LangCode;
  maxPlayers?: number;
  questionCount?: number;
}): Promise<{ code: string; roomId: string }> {
  const { supabase, userId } = await ensurePlayerProfile(hostName, language);

  let created: { id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        host_id: userId,
        category_id: categoryId,
        game_level: level,
        language,
        status: "waiting",
        current_question: 0,
        max_players: maxPlayers,
        question_count: questionCount,
      })
      .select("id, code")
      .single();
    if (!error && data) {
      created = data;
      break;
    }
    if (error && error.code !== "23505") throw error;
  }
  if (!created) throw new Error("Unable to generate a unique room code. Please try again.");

  const { error: playerError } = await supabase.from("room_players").insert({
    room_id: created.id,
    player_id: userId,
    display_name: hostName,
    score: 0,
    is_ready: true,
  });
  if (playerError) {
    await supabase.from("rooms").delete().eq("id", created.id);
    throw playerError;
  }

  return { code: created.code, roomId: created.id };
}

export async function joinBattleRoom({
  code,
  playerName,
  language,
}: {
  code: string;
  playerName: string;
  language: LangCode;
}): Promise<{ roomId: string; language: LangCode }> {
  const { supabase, userId } = await ensurePlayerProfile(playerName, language);
  const cleanCode = code.trim().toUpperCase();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, status, max_players, language")
    .eq("code", cleanCode)
    .maybeSingle();
  if (error) throw error;
  if (!room) throw new RoomError("ROOM_NOT_FOUND", "Room not found.");
  if (room.status !== "waiting") throw new RoomError("ROOM_STARTED", "This battle has already started.");

  const { count, error: countError } = await supabase
    .from("room_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);
  if (countError) throw countError;
  if (typeof count === "number" && count >= room.max_players) {
    throw new RoomError("ROOM_FULL", "This room is full.");
  }

  const { error: joinError } = await supabase.from("room_players").upsert(
    { room_id: room.id, player_id: userId, display_name: playerName, score: 0, is_ready: true },
    { onConflict: "room_id,player_id" }
  );
  if (joinError) throw joinError;

  return { roomId: room.id, language: room.language as LangCode };
}

function mapRoom(data: {
  id: string;
  code: string;
  host_id: string;
  status: string;
  current_question: number;
  question_count: number;
  language: string;
  category_id: string;
  game_level: number;
  max_players: number;
  question_started_at: string | null;
  question_ends_at: string | null;
}): RoomState {
  return {
    id: data.id,
    code: data.code,
    hostId: data.host_id,
    status: data.status as RoomPhase,
    currentQuestion: data.current_question,
    questionCount: data.question_count,
    language: data.language as LangCode,
    categoryId: data.category_id as CategoryId,
    gameLevel: data.game_level,
    maxPlayers: data.max_players,
    questionStartedAt: data.question_started_at,
    questionEndsAt: data.question_ends_at,
  };
}

export async function fetchRoomByCode(code: string): Promise<RoomState | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, code, host_id, status, current_question, question_count, language, category_id, game_level, max_players, question_started_at, question_ends_at"
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoom(data) : null;
}

export async function fetchRoomById(roomId: string): Promise<RoomState | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, code, host_id, status, current_question, question_count, language, category_id, game_level, max_players, question_started_at, question_ends_at"
    )
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoom(data) : null;
}

export async function fetchRoomPlayers(roomId: string): Promise<RoomPlayerState[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("room_players")
    .select("id, player_id, display_name, score, is_ready, current_streak, last_seen_at, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    playerId: p.player_id,
    displayName: p.display_name,
    score: p.score,
    isReady: p.is_ready,
    currentStreak: p.current_streak,
    lastSeenAt: p.last_seen_at,
    joinedAt: p.joined_at,
  }));
}

export async function fetchRoomQuestion(roomId: string, lang: LangCode): Promise<RoomQuestionView | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_room_question", { p_room_id: roomId, p_lang: lang });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    roomQuestionId: row.room_question_id,
    questionNumber: row.question_number,
    reference: row.reference,
    questionText: row.question_text,
    choices: [row.choice_1, row.choice_2, row.choice_3, row.choice_4],
    correctIndex: row.correct_index,
    explanation: row.explanation,
  };
}

export async function fetchAnswerCount(roomQuestionId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("answers")
    .select("*", { count: "exact", head: true })
    .eq("room_question_id", roomQuestionId);
  if (error) throw error;
  return count ?? 0;
}

export interface AnswerRow {
  id: string;
  roomQuestionId: string;
  playerId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsAwarded: number;
  submittedAt: string;
}

const ANSWER_COLUMNS =
  "id, room_question_id, player_id, selected_answer, is_correct, response_time_ms, points_awarded, submitted_at";

function mapAnswerRow(a: {
  id: string;
  room_question_id: string;
  player_id: string;
  selected_answer: number;
  is_correct: boolean;
  response_time_ms: number;
  points_awarded: number;
  submitted_at: string;
}): AnswerRow {
  return {
    id: a.id,
    roomQuestionId: a.room_question_id,
    playerId: a.player_id,
    selectedAnswer: a.selected_answer,
    isCorrect: a.is_correct,
    responseTimeMs: a.response_time_ms,
    pointsAwarded: a.points_awarded,
    submittedAt: a.submitted_at,
  };
}

export async function fetchAnswersForQuestion(roomQuestionId: string): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("answers")
    .select(ANSWER_COLUMNS)
    .eq("room_question_id", roomQuestionId)
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAnswerRow);
}

export async function fetchAllRoomAnswers(roomId: string): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("answers").select(ANSWER_COLUMNS).eq("room_id", roomId);
  if (error) throw error;
  return (data ?? []).map(mapAnswerRow);
}

export async function fetchMyAnswers(roomId: string, playerId: string): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("answers")
    .select(ANSWER_COLUMNS)
    .eq("room_id", roomId)
    .eq("player_id", playerId);
  if (error) throw error;
  return (data ?? []).map(mapAnswerRow);
}

export async function submitAnswer(
  roomId: string,
  roomQuestionId: string,
  selectedAnswer: number
): Promise<{ alreadySubmitted: boolean; isCorrect: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_answer", {
    p_room_id: roomId,
    p_room_question_id: roomQuestionId,
    p_selected_answer: selectedAnswer,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { alreadySubmitted: Boolean(row?.already_submitted), isCorrect: Boolean(row?.is_correct) };
}

export async function toggleReady(roomId: string, playerId: string, ready: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("room_players").update({ is_ready: ready }).eq("room_id", roomId).eq("player_id", playerId);
  if (error) throw error;
}

export async function heartbeat(roomId: string, playerId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("room_players").update({ last_seen_at: new Date().toISOString() }).eq("room_id", roomId).eq("player_id", playerId);
}

export function startHeartbeat(roomId: string, playerId: string): () => void {
  void heartbeat(roomId, playerId);
  const id = window.setInterval(() => void heartbeat(roomId, playerId), HEARTBEAT_INTERVAL_MS);
  return () => window.clearInterval(id);
}

/** Chooses the room's 10 (or configured) question ids and inserts
 * room_questions — same local/DB question-bank fallback the app already
 * uses for solo play. Must run before start_battle() (which verifies the
 * rows already exist). */
export async function seedRoomQuestions(room: RoomState): Promise<void> {
  const supabase = createClient();
  let ids: string[] = [];

  try {
    const dbQuestions = await loadQuestionsForLevel(room.gameLevel, room.language);
    ids = dbQuestions.slice(0, room.questionCount).map((q) => q.id);
  } catch (error) {
    console.warn("Database question load failed; using local bank.", error);
  }
  if (ids.length < room.questionCount) {
    const local = questionsForLevel(room.language, room.categoryId, room.gameLevel).questions;
    ids = local.slice(0, room.questionCount).map((q) => q.id);
  }
  if (ids.length < room.questionCount) {
    const english = questionsForLevel("en", room.categoryId, room.gameLevel).questions;
    ids = english.slice(0, room.questionCount).map((q) => q.id);
  }
  if (ids.length < room.questionCount) {
    throw new Error("This level needs more questions before the battle can start.");
  }

  await supabase.from("room_questions").delete().eq("room_id", room.id);
  const rows = ids.map((questionId, index) => ({ room_id: room.id, question_number: index + 1, question_id: questionId }));
  const { error } = await supabase.from("room_questions").insert(rows);
  if (error) throw error;
}

export async function startBattle(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("start_battle", { p_room_id: roomId });
  if (error) throw error;
}

export async function resolveRound(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("resolve_round", { p_room_id: roomId });
  if (error) throw error;
}

export async function advancePhase(roomId: string, to: RoomPhase): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("advance_phase", { p_room_id: roomId, p_to: to });
  if (error) throw error;
}

export async function removePlayer(roomId: string, targetPlayerId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("room_players").delete().eq("room_id", roomId).eq("player_id", targetPlayerId);
  if (error) throw error;
}

export async function endRoom(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;
}

export async function leaveRoom(roomId: string, playerId: string, isHost: boolean): Promise<void> {
  if (isHost) {
    await endRoom(roomId);
    return;
  }
  const supabase = createClient();
  await supabase.from("room_players").delete().eq("room_id", roomId).eq("player_id", playerId);
}
