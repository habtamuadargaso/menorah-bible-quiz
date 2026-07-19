"use client";

import type { UIStrings } from "@/lib/i18n/types";
import type { AnswerRow, RoomPlayerState } from "@/lib/liveBattleRoom";
import BattleSummary from "@/components/battle/BattleSummary";
import type { BattleLeaderboardEntry } from "@/components/battle/BattleLeaderboard";

export default function HostFinalResults({
  t,
  players,
  allAnswers,
  onNewBattle,
}: {
  t: UIStrings;
  players: RoomPlayerState[];
  allAnswers: AnswerRow[];
  onNewBattle: () => void;
}) {
  const th = t.multiplayerHost;

  const entries: BattleLeaderboardEntry[] = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ id: p.id, name: p.displayName, score: p.score, isYou: false }));

  const totalAnswers = allAnswers.length;
  const correctAnswers = allAnswers.filter((a) => a.isCorrect).length;
  const accuracyPct = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const correctResponses = allAnswers.filter((a) => a.isCorrect);
  const fastestMs = correctResponses.length > 0 ? Math.min(...correctResponses.map((a) => a.responseTimeMs)) : 0;
  const winnerScore = entries[0]?.score ?? 0;

  return (
    <main
      className="min-h-screen w-full px-4 py-4 text-[#f3efe2]"
      style={{ background: "linear-gradient(165deg,#080d22 0%,#171034 45%,#080d22 100%)" }}
    >
      <BattleSummary
        entries={entries}
        championLabel={th.finalWinnerHeading}
        topThreeHeading={th.finalTopThreeHeading}
        playersHeading={th.finalLeaderboardHeading}
        xpEarned={winnerScore}
        coinsEarned={Math.round(winnerScore / 10)}
        accuracyPct={accuracyPct}
        reactionSeconds={fastestMs / 1000}
        xpLabel={th.finalXpLabel}
        coinsLabel={th.finalRewardsLabel}
        accuracyLabel={th.finalAccuracyLabel}
        reactionLabel={th.finalFastestResponseLabel}
        secondsShort={t.battleShared.secondsShort}
        leaveLabel={th.newBattleButton}
        onLeave={onNewBattle}
      />
    </main>
  );
}
