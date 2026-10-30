"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  COMPLEXITIES,
  LANGUAGES,
  LIMITS,
  TEXT_KINDS,
  type Config,
  type ConfigPatch,
} from "@/lib/race/config";

type Reply = { ok: true } | { ok: false; reason: keyof Dictionary["config"]["errors"] };

type Props = {
  config: Config;
  isHost: boolean;
  // Envoie une modification au serveur et reçoit sa réponse.
  update: (patch: ConfigPatch, reply: (r: Reply) => void) => void;
  t: Dictionary["config"];
  levels: Dictionary["levels"];
};

const radioClass =
  "border-trait has-[:checked]:border-bleu has-[:checked]:bg-surface-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-3";
const inputClass =
  "border-trait bg-surface min-h-11 w-full rounded-xl border-2 px-3 font-normal disabled:opacity-60";
const legendClass = "mb-2 font-bold";

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

// Configuration de la course (CONF-01 à CONF-12) : l'hôte la modifie dans la
// salle d'attente ; les autres en voient un résumé, mis à jour en direct.
export function ConfigPanel({ config, isHost, update, t, levels }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { text } = config;

  function send(patch: ConfigPatch) {
    setError(null);
    update(patch, (reply) => {
      if (!reply.ok) setError(t.errors[reply.reason] ?? t.errors.invalid);
    });
  }

  // Champs texte et nombres : envoyés en quittant le champ (ou avec Entrée),
  // pas à chaque touche. `key` remet le champ à jour quand la valeur change.
  function commitNumber(
    field: HTMLInputElement,
    current: number,
    limits: { min: number; max: number },
    make: (value: number) => ConfigPatch,
  ) {
    const value = clamp(Number(field.value), limits);
    if (Number.isNaN(Number(field.value)) || value === current) field.value = String(current);
    else send(make(value));
  }

  if (!isHost) return <Summary config={config} t={t} levels={levels} />;

  const seconds = config.timeLimitMs === null ? null : config.timeLimitMs / 1000;
  const randomOnly = text.kind === "COHERENT";

  return (
    <section
      aria-labelledby="titre-config"
      className="bg-surface flex flex-col gap-6 rounded-3xl p-7"
    >
      <h2 id="titre-config" className="font-display text-3xl font-extrabold">
        {t.title}
      </h2>
      <form
        className="grid gap-8 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <fieldset className="flex flex-col gap-5">
          <legend className="font-display mb-3 text-xl font-extrabold">{t.textGroup}</legend>

          <fieldset>
            <legend className={legendClass}>{t.language}</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <label key={language} className={radioClass}>
                  <input
                    type="radio"
                    name="language"
                    checked={text.language === language}
                    onChange={() => send({ language })}
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.languages[language]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClass}>{t.kind}</legend>
            <div className="flex flex-col gap-2">
              {TEXT_KINDS.map((kind) => (
                <label key={kind} className={radioClass}>
                  <input
                    type="radio"
                    name="kind"
                    checked={text.kind === kind}
                    onChange={() => send({ kind })}
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.kinds[kind]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClass}>{t.complexity}</legend>
            <div className="flex flex-wrap gap-2">
              {COMPLEXITIES.map((complexity) => (
                <label key={complexity} className={radioClass}>
                  <input
                    type="radio"
                    name="complexity"
                    checked={text.complexity === complexity}
                    onChange={() => send({ complexity })}
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {levels[complexity]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1 font-bold">
            {t.wordCount}
            <input
              key={text.wordCount}
              type="number"
              inputMode="numeric"
              min={LIMITS.wordCount.min}
              max={LIMITS.wordCount.max}
              defaultValue={text.wordCount}
              onBlur={(e) =>
                commitNumber(e.currentTarget, text.wordCount, LIMITS.wordCount, (wordCount) => ({
                  wordCount,
                }))
              }
              className={inputClass}
            />
          </label>

          <fieldset>
            <legend className={legendClass}>{t.options}</legend>
            <div className="flex flex-wrap gap-2">
              {(["punctuation", "numbers", "capitals", "accents"] as const)
                .filter((option) => option !== "accents" || text.language === "FR")
                .map((option) => (
                  <label key={option} className={radioClass}>
                    <input
                      type="checkbox"
                      checked={text[option]}
                      onChange={(e) => send({ [option]: e.currentTarget.checked })}
                      className="size-5 accent-[var(--bleu)]"
                    />
                    {t[option]}
                  </label>
                ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            {(["include", "exclude"] as const).map((field) => (
              <label key={field} className="flex flex-col gap-1 font-bold">
                {t[field]}
                <input
                  key={text[field]}
                  type="text"
                  maxLength={LIMITS.chars}
                  defaultValue={text[field]}
                  disabled={randomOnly}
                  aria-describedby="aide-caracteres"
                  autoComplete="off"
                  spellCheck={false}
                  onBlur={(e) => {
                    if (e.currentTarget.value !== text[field])
                      send({ [field]: e.currentTarget.value });
                  }}
                  className={`${inputClass} font-mono`}
                />
              </label>
            ))}
            <p id="aide-caracteres" className="text-sourdine text-sm">
              {randomOnly ? t.charsCoherent : t.charsHelp}
            </p>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="font-display mb-3 text-xl font-extrabold">{t.raceGroup}</legend>

          <fieldset>
            <legend className={legendClass}>{t.errorMode}</legend>
            <div className="flex flex-col gap-2">
              {(["STRICT", "FREE"] as const).map((errorMode) => (
                <label key={errorMode} className={radioClass}>
                  <input
                    type="radio"
                    name="errorMode"
                    checked={config.errorMode === errorMode}
                    onChange={() => send({ errorMode })}
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.errorModes[errorMode]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={legendClass}>{t.timeLimit}</legend>
            <label className={radioClass}>
              <input
                type="checkbox"
                checked={seconds !== null}
                onChange={(e) => send({ timeLimitSec: e.currentTarget.checked ? 120 : null })}
                className="size-5 accent-[var(--bleu)]"
              />
              {t.timeLimit}
            </label>
            {seconds !== null && (
              <label className="flex flex-col gap-1 font-bold">
                {t.seconds}
                <input
                  key={seconds}
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.timeLimitSec.min}
                  max={LIMITS.timeLimitSec.max}
                  step={10}
                  defaultValue={seconds}
                  onBlur={(e) =>
                    commitNumber(e.currentTarget, seconds, LIMITS.timeLimitSec, (timeLimitSec) => ({
                      timeLimitSec,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            )}
          </fieldset>

          <label className={radioClass}>
            <input
              type="checkbox"
              checked={config.bonuses}
              onChange={(e) => send({ bonuses: e.currentTarget.checked })}
              className="size-5 accent-[var(--bleu)]"
            />
            {t.bonuses}
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="font-display mb-3 text-xl font-extrabold">{t.roomGroup}</legend>

          <fieldset>
            <legend className={legendClass}>{t.visibility}</legend>
            <div className="flex flex-col gap-2">
              {(["PUBLIC", "SEMI_PUBLIC"] as const).map((visibility) => (
                <label key={visibility} className={radioClass}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={config.visibility === visibility}
                    onChange={() => send({ visibility })}
                    className="size-5 accent-[var(--bleu)]"
                  />
                  {t.visibilities[visibility]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1 font-bold">
            {t.maxPlayers}
            <input
              key={config.maxPlayers}
              type="number"
              inputMode="numeric"
              min={LIMITS.maxPlayers.min}
              max={LIMITS.maxPlayers.max}
              defaultValue={config.maxPlayers}
              onBlur={(e) =>
                commitNumber(
                  e.currentTarget,
                  config.maxPlayers,
                  LIMITS.maxPlayers,
                  (maxPlayers) => ({
                    maxPlayers,
                  }),
                )
              }
              className={inputClass}
            />
          </label>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="text-faute font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}

// Ce que voient les personnes qui ne sont pas l'hôte.
function Summary({ config, t, levels }: Omit<Props, "isHost" | "update">) {
  const { text } = config;
  const yes = (value: boolean) => (value ? t.on : t.off);
  const rows: [string, string][] = [
    [t.language, t.languages[text.language]],
    [t.kind, t.kinds[text.kind]],
    [t.complexity, levels[text.complexity]],
    [t.wordCount, String(text.wordCount)],
    [t.punctuation, yes(text.punctuation)],
    [t.numbers, yes(text.numbers)],
    [t.capitals, yes(text.capitals)],
    ...(text.language === "FR" ? [[t.accents, yes(text.accents)] as [string, string]] : []),
    ...(text.kind === "RANDOM"
      ? ([
          [t.include, text.include || "—"],
          [t.exclude, text.exclude || "—"],
        ] as [string, string][])
      : []),
    [t.errorMode, t.errorModes[config.errorMode]],
    [t.timeLimit, config.timeLimitMs === null ? t.noLimit : `${config.timeLimitMs / 1000} s`],
    [t.bonuses, yes(config.bonuses)],
    [t.visibility, t.visibilities[config.visibility]],
    [t.maxPlayers, String(config.maxPlayers)],
  ];
  return (
    <section
      aria-labelledby="titre-config"
      className="bg-surface flex flex-col gap-4 rounded-3xl p-7"
    >
      <h2 id="titre-config" className="font-display text-3xl font-extrabold">
        {t.title}
      </h2>
      <p className="text-sourdine">{t.hostOnly}</p>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sourdine text-sm">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
