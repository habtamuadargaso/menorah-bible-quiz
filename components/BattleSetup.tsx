"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface BattlePlayer {
  id: string;
  name: string;
}

export interface BattleConfig {
  players: BattlePlayer[];
  categoryId: CategoryId;
  level: number;
}

export default function BattleSetup({
  onStart,
  onBack,
}: {
  onStart: (config: BattleConfig) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [names, setNames] = useState([`${t.battle.player} 1`, `${t.battle.player} 2`]);
  const [categoryId, setCategoryId] = useState<CategoryId>("old-testament");
  const [level, setLevel] = useState(1);

  const valid = useMemo(() => names.every((name) => name.trim().length > 0), [names]);

  function updateName(index: number, name: string) {
    setNames((current) => current.map((value, i) => (i === index ? name : value)));
  }

  function addPlayer() {
    if (names.length >= 4) return;
    setNames((current) => [...current, `${t.battle.player} ${current.length + 1}`]);
  }

  function removePlayer(index: number) {
    if (names.length <= 2) return;
    setNames((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <div className="rounded-[28px] border border-gold-500/25 bg-white/[0.045] p-6 shadow-[0_28px_80px_rgba(0,0,0,.4)] sm:p-10">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-gold-500">⚔ {t.battle.title}</div>
          <h2 className="mt-3 font-display text-3xl font-bold text-[#fbf6e8] sm:text-4xl">{t.battle.sameQuestionTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#a7aebd]">
            {t.battle.setupDescription}
          </p>
        </div>

        <div className="mt-9 grid gap-7 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-bold text-[#f7f0dc]">{t.battle.players}</div>
            <div className="space-y-3">
              {names.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={name}
                    onChange={(event) => updateName(index, event.target.value)}
                    maxLength={18}
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-navy-950/70 px-4 py-3 text-[#fbf6e8] outline-none focus:border-gold-500"
                    aria-label={`${t.battle.player} ${index + 1}`}
                  />
                  {names.length > 2 && (
                    <button onClick={() => removePlayer(index)} className="rounded-xl border border-red-400/30 px-3 text-red-300 hover:bg-red-500/10" aria-label={t.battle.removePlayer}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addPlayer}
              disabled={names.length >= 4}
              className="mt-3 w-full rounded-xl border border-gold-500/35 py-3 text-sm font-bold text-gold-400 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {`+ ${t.battle.addPlayer} (${names.length}/4)`}
            </button>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#f7f0dc]">{t.battle.category}</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value as CategoryId)}
                className="w-full rounded-xl border border-white/15 bg-navy-950 px-4 py-3 text-[#fbf6e8] outline-none focus:border-gold-500"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{t.categories[category.id].title}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#f7f0dc]">{t.battle.battleLevel}</span>
              <select
                value={level}
                onChange={(event) => setLevel(Number(event.target.value))}
                className="w-full rounded-xl border border-white/15 bg-navy-950 px-4 py-3 text-[#fbf6e8] outline-none focus:border-gold-500"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>{t.common.level} {value}</option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-xs leading-relaxed text-[#c6cbd6]">
              <strong className="text-gold-400">{t.battle.scoringLabel}:</strong> {t.battle.scoringText}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={onBack} className="rounded-full border border-white/20 px-7 py-3 font-bold text-[#d7dbe4] hover:bg-white/5">{t.battle.back}</button>
          <button
            disabled={!valid}
            onClick={() => onStart({
              categoryId,
              level,
              players: names.map((name, index) => ({ id: `p${index + 1}`, name: name.trim() })),
            })}
            className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 px-9 py-3 font-extrabold text-navy-950 shadow-gold hover:-translate-y-0.5 disabled:opacity-50"
          >
            Start Battle
          </button>
        </div>
      </div>
    </section>
  );
}
