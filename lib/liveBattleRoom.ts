// Online Church Mode — data layer (host TV + private player phones).
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
import { difficultyForLevel } from "@/lib/levels";
import { loadQuestionsForLevel } from "@/lib/questions/loadQuestions";
import { selectRoomQuestionIds } from "@/lib/questions/selectRoomQuestions";

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
  phaseEndsAt: string | null;
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
  /** Mission 13: this player's own display language — independent of the
   * host's rooms.language, which only ever affects the host's own screen.
   * Chosen before joining, changeable while the room is still "waiting"
   * (see setPlayerLanguage), locked once the battle starts. */
  languageCode: LangCode;
}

export interface RoomQuestionView {
  roomQuestionId: string;
  questionNumber: number;
  reference: string;
  questionText: string;
  choices: [string, string, string, string];
  correctIndex: number | null;
  explanation: string | null;
  /** Mission 10: false means get_room_question() found no exact-language,
   * published translation for this question — the RPC no longer silently
   * substitutes English (see supabase/migrations/
   * 20260730_mission10_translation_workflow.sql). seedRoomQuestions()
   * already only ever seeds questions confirmed to have the room's
   * language published, so this should be true in ordinary operation;
   * false signals a genuine, exceptional data problem (e.g. a translation
   * archived mid-battle) rather than a language mismatch to paper over. */
  translationAvailable: boolean;
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

/** The language a player picked the last time they joined a battle — used
 * only to prefill the join form's language step, never to skip it. */
export function getSavedPlayerLanguage(): LangCode | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem("menorah-player-language");
  return (saved as LangCode) || null;
}

function savePlayerLanguage(language: LangCode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("menorah-player-language", language);
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

  // A room that was created but never started (status stays "waiting"
  // forever) still owns the room_questions seedRoomQuestions() inserted for
  // it. get_question_answer_keys() (see the online-live-battle migration)
  // refuses to hand back an answer key for any question tied to a
  // non-finished room the caller belongs to until that room's round has
  // been revealed — so an abandoned "waiting" room permanently hides its 10
  // questions from this same host's future loadQuestionsForLevel() calls.
  // Repeatedly creating and abandoning rooms during testing/dev therefore
  // shrinks the host's visible pool over time even though the questions
  // table itself is untouched. Clearing the host's own never-started rooms
  // before seeding a new one frees those questions back up; RLS only lets a
  // host delete rooms they own, and the delete cascades into
  // room_players/room_questions/answers.
  await supabase.from("rooms").delete().eq("host_id", userId).eq("status", "waiting");

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
    // The host's own room_players row carries the host's language too, so
    // the waiting room's player list can show it consistently — this never
    // affects any other player's question fetch, which always uses its own
    // row's language_code (see fetchRoomQuestion callers).
    language_code: language,
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
    // This player's own chosen language — independent of the host's
    // room.language. Every later question fetch for this player reads it
    // back from this row (see fetchRoomPlayers / the player page), never
    // from the room itself.
    language_code: language,
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

  savePlayerLanguage(language);

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
  phase_ends_at: string | null;
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
    phaseEndsAt: data.phase_ends_at,
  };
}

export async function fetchRoomByCode(code: string): Promise<RoomState | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, code, host_id, status, current_question, question_count, language, category_id, game_level, max_players, question_started_at, question_ends_at, phase_ends_at"
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
      "id, code, host_id, status, current_question, question_count, language, category_id, game_level, max_players, question_started_at, question_ends_at, phase_ends_at"
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
    .select("id, player_id, display_name, score, is_ready, current_streak, last_seen_at, joined_at, language_code")
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
    languageCode: p.language_code as LangCode,
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
    translationAvailable: Boolean(row.translation_available),
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

/** Changes the caller's own language while still in the waiting room. Goes
 * through set_room_player_language() rather than a direct column update —
 * that RPC is the only thing that can write room_players.language_code
 * after the initial join, and it rejects the call once room.status is no
 * longer "waiting", so language really is locked once the battle starts
 * regardless of what a client attempts. */
export async function setPlayerLanguage(roomId: string, languageCode: LangCode): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_room_player_language", {
    p_room_id: roomId,
    p_language_code: languageCode,
  });
  if (error) throw error;
  savePlayerLanguage(languageCode);
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

/** The host's own most recently COMPLETED room (any level/category),
 * excluding the brand-new room currently being seeded. Its question ids
 * are used by seedRoomQuestions() as a best-effort "don't immediately
 * repeat" exclusion (Mission 14 #15) — harmless no-op overlap with a
 * different level's pool, since a question only ever belongs to one level. */
async function fetchRecentlyUsedQuestionIds(
  supabase: ReturnType<typeof createClient>,
  hostId: string,
  excludeRoomId: string
): Promise<Set<string>> {
  const { data: recentRoom } = await supabase
    .from("rooms")
    .select("id")
    .eq("host_id", hostId)
    .eq("status", "finished")
    .neq("id", excludeRoomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!recentRoom) return new Set();

  const { data: recentQuestions } = await supabase.from("room_questions").select("question_id").eq("room_id", recentRoom.id);
  return new Set((recentQuestions ?? []).map((r) => r.question_id as string));
}

/** Chooses the room's 10 (or configured) question ids and inserts
 * room_questions. Online Church Mode only ever uses question IDs verified
 * to exist (and be published) in Supabase — unlike solo play, it never
 * falls back to the local/offline question bank, because a local-only id
 * has no row in `questions` and would silently fail to join in
 * get_room_question(), starting a battle with a question nobody can ever
 * see. If there aren't enough real database questions for this level, the
 * battle must not be created — the caller (the create-room flow) surfaces
 * this as an error instead of a broken room. Must run before
 * start_battle() (which independently re-verifies every row it inserted
 * still joins to a real, published question).
 *
 * Mission 14 root cause this fixes: the old version fetched the full
 * eligible pool (loadQuestionsForLevel already applies no DB LIMIT) but
 * then did `dbQuestions.slice(0, questionCount)` — Postgres returns rows
 * with no ORDER BY in a stable-but-unspecified (effectively physical/
 * insertion) order, so every room for the same level+language got the
 * exact same first N questions every time, and newly published questions
 * inserted later never surfaced unless they happened to sort earlier. This
 * always sampled the FULL published-and-language-matched pool via
 * loadQuestionsForLevel (never DB-side LIMIT'd), then shuffles that whole
 * pool (lib/shuffle.ts's Fisher-Yates, the same helper solo play's
 * loadQuestionsForGame.ts already uses) before taking the first N —
 * genuine randomization over the true eligible set, not a reshuffle of an
 * already-small slice. Each new room also gets fresh room_questions rows
 * tied to its own brand-new room id, so a previous/abandoned room's rows
 * are never reused (room_questions is always empty for a room id that was
 * just created; the delete below is defensive/idempotent only). */
export async function seedRoomQuestions(room: RoomState): Promise<void> {
  const supabase = createClient();
  const levelLanguagePool = await loadQuestionsForLevel(room.gameLevel, room.language);
  const recentlyUsedIds = await fetchRecentlyUsedQuestionIds(supabase, room.hostId, room.id);

  const result = selectRoomQuestionIds({
    levelLanguagePool,
    categoryId: room.categoryId,
    questionCount: room.questionCount,
    recentlyUsedIds,
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[seedRoomQuestions]", {
      roomId: room.id,
      level: room.gameLevel,
      difficulty: difficultyForLevel(room.gameLevel),
      language: room.language,
      categoryId: room.categoryId,
      eligibleCount: result.eligibleCount,
      categoryEligibleCount: result.categoryEligibleCount,
      usedCategoryFallback: result.usedCategoryFallback,
      usedRecentExclusion: result.usedRecentExclusion,
      selectedQuestionIds: result.selectedQuestionIds,
    });
  }

  await supabase.from("room_questions").delete().eq("room_id", room.id);
  const rows = result.selectedQuestionIds.map((questionId, index) => ({
    room_id: room.id,
    question_number: index + 1,
    question_id: questionId,
  }));
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

/** Same pattern as resolveRoundIfExpired, extended to the countdown/reveal/
 * leaderboard transitions — a server-verified no-op unless phase_ends_at has
 * genuinely passed, callable by any room member so a stalled room still
 * advances if the host has disconnected. */
export async function advancePhaseIfExpired(roomId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("advance_phase_if_expired", { p_room_id: roomId });
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