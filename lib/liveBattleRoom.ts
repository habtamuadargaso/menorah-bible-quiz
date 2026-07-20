// Online Live Battle — data layer (host TV + private player phones).
//
// This replaces the old local shared-screen battle (BattleSetup/BattleArena,
// removed) as the app's real multiplayer mode. It talks to the existing
// rooms/room_players/room_questions/answers/profiles tables plus the secure
// RPCs added in supabase/migrations/20260719_online_live_battle.sql
// (submit_answer, resolve_round, resolve_round_if_expired, advance_phase,
// start_battle, get_room_question, get_answer_count, get_my_answer,
// get_reveal_answers, get_final_leaderboard) — scoring, phase transitions,
// and every cross-player answer read are never computed or read directly
// client-side; this module only ever asks the database to do them.
import { createClient } from "@/lib/supabase/client";
import type { LangCode } from "@/lib/i18n/locales";
import type { CategoryId } from "@/lib/categories";
import { loadQuestionsForLevel } from "@/lib/questions/loadQuestions";

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
    is_ready: true,
    last_seen_at: new Date().toISOString(),
  });

  if (playerError) {
    console.error("HOST ROOM_PLAYER INSERT ERROR", {
      code: playerError.code,
      message: playerError.message,
      details: playerError.details,
      hint: playerError.hint,
    });

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

  const { error: joinError } = await supabase.from("room_players").insert({
    room_id: room.id,
    player_id: userId,
    display_name: playerName,
    is_ready: true,
    last_seen_at: new Date().toISOString(),
  });

  if (joinError && joinError.code !== "23505") {
    console.error("JOIN ROOM_PLAYER INSERT ERROR", {
      code: joinError.code,
      message: joinError.message,
      details: joinError.details,
      hint: joinError.hint,
    });

    throw joinError;
  }

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

// The "answers" table now only lets a player SELECT their own row directly
// (see the migration) — every cross-player read below goes through a
// SECURITY DEFINER RPC instead of a raw table query, so there is no path
// (this module or a raw REST call) that can read another player's
// selection before it's meant to be visible.

/** Safe at any phase — never reveals what anyone chose, just how many. */
export async function fetchAnswerCount(roomQuestionId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_answer_count", { p_room_question_id: roomQuestionId });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
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

export interface MyAnswer {
  selectedAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsAwarded: number;
  submittedAt: string;
}

/** The caller's own answer for one question — safe at any phase. */
export async function fetchMyAnswer(roomQuestionId: string): Promise<MyAnswer | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_my_answer", { p_room_question_id: roomQuestionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    selectedAnswer: row.selected_answer,
    isCorrect: row.is_correct,
    responseTimeMs: row.response_time_ms,
    pointsAwarded: row.points_awarded,
    submittedAt: row.submitted_at,
  };
}

/** All of the caller's own answers across the whole battle, for the final
 * personal-stats screen (accuracy, correct count, avg response time). This
 * is a plain table query, not an RPC — it's safe purely because "Players
 * can read own answers" (the migration's section 2) restricts every SELECT
 * on `answers` to `player_id = auth.uid()` regardless of how the query is
 * filtered, so passing `playerId` here is for the caller's own clarity, not
 * for security; the database enforces it either way. */
export async function fetchMyAnswers(roomId: string, playerId: string): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("id, room_question_id, player_id, selected_answer, is_correct, response_time_ms, points_awarded, submitted_at")
    .eq("room_id", roomId)
    .eq("player_id", playerId);
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    roomQuestionId: a.room_question_id,
    playerId: a.player_id,
    selectedAnswer: a.selected_answer,
    isCorrect: a.is_correct,
    responseTimeMs: a.response_time_ms,
    pointsAwarded: a.points_awarded,
    submittedAt: a.submitted_at,
  }));
}

/** Every player's answer for one question — only returns rows once that
 * question's round has actually ended; throws before that. Used for the
 * host's reveal screen (distribution + fastest correct player). */
export async function fetchRevealAnswers(roomQuestionId: string): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_reveal_answers", { p_room_question_id: roomQuestionId });
  if (error) throw error;
  return ((data ?? []) as Array<{
    player_id: string;
    selected_answer: number;
    is_correct: boolean;
    response_time_ms: number;
    points_awarded: number;
    submitted_at: string;
  }>).map((a) => ({
    id: `${roomQuestionId}-${a.player_id}`,
    roomQuestionId,
    playerId: a.player_id,
    selectedAnswer: a.selected_answer,
    isCorrect: a.is_correct,
    responseTimeMs: a.response_time_ms,
    pointsAwarded: a.points_awarded,
    submittedAt: a.submitted_at,
  }));
}

export interface FinalLeaderboardRow {
  playerId: string;
  displayName: string;
  score: number;
  currentStreak: number;
  rank: number;
}

/** Final scoreboard, host row excluded, ranked server-side. */
export async function fetchFinalLeaderboard(roomId: string): Promise<FinalLeaderboardRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_final_leaderboard", { p_room_id: roomId });
  if (error) throw error;
  return ((data ?? []) as Array<{
    player_id: string;
    display_name: string;
    score: number;
    current_streak: number;
    rank: number;
  }>).map((r) => ({
    playerId: r.player_id,
    displayName: r.display_name,
    score: r.score,
    currentStreak: r.current_streak,
    rank: r.rank,
  }));
}

export interface FinalStats {
  totalAnswers: number;
  correctAnswers: number;
  fastestCorrectResponseMs: number | null;
}

/** Room-wide totals only (accuracy %, fastest response) — never a
 * per-player breakdown. Only returns rows once the room is finished. */
export async function fetchFinalStats(roomId: string): Promise<FinalStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_final_stats", { p_room_id: roomId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalAnswers: row?.total_answers ?? 0,
    correctAnswers: row?.correct_answers ?? 0,
    fastestCorrectResponseMs: row?.fastest_correct_response_ms ?? null,
  };
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
 * room_questions. Online Live Battle only ever uses question IDs verified
 * to exist (and be published) in Supabase — unlike solo play, it never
 * falls back to the local/offline question bank, because a local-only id
 * has no row in `questions` and would silently fail to join in
 * get_room_question(), starting a battle with a question nobody can ever
 * see. If there aren't enough real database questions for this level, the
 * battle must not be created — the caller (the create-room flow) surfaces
 * this as an error instead of a broken room. Must run before
 * start_battle() (which independently re-verifies every row it inserted
 * still joins to a real, published question). */
export async function seedRoomQuestions(room: RoomState): Promise<void> {
  const supabase = createClient();
  const dbQuestions = await loadQuestionsForLevel(room.gameLevel, room.language);
  const ids = dbQuestions.slice(0, room.questionCount).map((q) => q.id);

  if (ids.length < room.questionCount) {
    throw new Error(
      `This level only has ${ids.length} online question(s) available — Online Live Battle needs at least ${room.questionCount}. Add more questions in Supabase or choose a different level.`
    );
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

/** Host-only early resolution (e.g. once everyone has answered). */
export async function resolveRound(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("resolve_round", { p_room_id: roomId });
  if (error) throw error;
}

/** Callable by ANY room member, not just the host — it is a server-verified
 * no-op unless the question's deadline has genuinely passed. Every
 * connected client (host and players) calls this once its own synced
 * countdown reaches zero, so a round still resolves even if the host has
 * disconnected — see the migration's section 4 for the full rationale. */
export async function resolveRoundIfExpired(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("resolve_round_if_expired", { p_room_id: roomId });
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