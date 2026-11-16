"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  COMPLEXITIES,
  LANGUAGES,
  LIMITS,
  TEXT_KINDS,
  VISIBILITIES,
  type Config,
  type ConfigPatch,
} from "@/lib/race/config";

export type ConfigReply =
  { ok: true } | { ok: false; reason: keyof Dictionary["config"]["errors"] };

type Props = {
  config: Config;
  isHost: boolean;
  // Envoie une modification au serveur et reçoit sa réponse.
  update: (patch: ConfigPatch, reply: (r: ConfigReply) => void) => void;
  // Contrôle affiché à droite du titre (le choix « Je cours / Je regarde »).
  aside?: ReactNode;
  t: Dictionary["config"];
  levels: Dictionary["levels"];
};

const TABS = ["text", "race", "room"] as const;
type Tab = (typeof TABS)[number];
const PRESET_SECONDS = [60, 120] as const;

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

// Configuration de la course (CONF-01 à CONF-12), en trois onglets. L'hôte la
// modifie dans la salle d'attente ; les autres voient les mêmes onglets en
// lecture seule, mis à jour en direct.
export function ConfigPanel({ config, isHost, update, aside, t, levels }: Props) {
  const [tab, setTab] = useState<Tab>("text");
  const [error, setError] = useState<string | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    text: null,
    race: null,
    room: null,
  });
  const id = useId();
  const { text } = config;

  function send(patch: ConfigPatch) {
    setError(null);
    update(patch, (reply) => {
      if (!reply.ok) setError(t.errors[reply.reason] ?? t.errors.invalid);
    });
  }

  // Onglets au clavier (motif ARIA) : les flèches passent d'un onglet à l'autre.
  function onTabKey(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length];
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const tabNames: Record<Tab, string> = { text: t.textGroup, race: t.raceGroup, room: t.roomGroup };
  const yes = (value: boolean) => (value ? t.on : t.off);
  const seconds = config.timeLimitMs === null ? null : config.timeLimitMs / 1000;
  const customTime = seconds !== null && !(PRESET_SECONDS as readonly number[]).includes(seconds);

  return (
    <section
      aria-labelledby={`${id}-titre`}
      className="carte motion-safe:animate-monte flex min-w-0 flex-col gap-5 p-5 [animation-delay:160ms] sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={`${id}-titre`} className="font-display text-[clamp(22px,3vw,28px)] font-extrabold">
          {t.title}
        </h2>
        {aside}
      </div>
      {!isHost && <p className="text-sourdine -mt-2 text-sm">{t.hostOnly}</p>}

      <div role="tablist" aria-label={t.tabsLabel} className="onglets" onKeyDown={onTabKey}>
        {TABS.map((name) => (
          <button
            key={name}
            ref={(el) => {
              tabRefs.current[name] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-onglet-${name}`}
            aria-selected={tab === name}
            aria-controls={`${id}-panneau`}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            className="onglet"
          >
            {tabNames[name]}
          </button>
        ))}
      </div>

      <div
        key={tab}
        role="tabpanel"
        id={`${id}-panneau`}
        aria-labelledby={`${id}-onglet-${tab}`}
        aria-live={isHost ? undefined : "polite"}
        className="motion-safe:animate-monte flex flex-col [animation-duration:0.4s]"
      >
        {tab === "text" && (
          <>
            <Row label={t.language}>
              {isHost ? (
                <Segment
                  label={t.language}
                  values={LANGUAGES}
                  names={t.languages}
                  value={text.language}
                  onChange={(language) => send({ language })}
                />
              ) : (
                <Value>{t.languages[text.language]}</Value>
              )}
            </Row>
            <Row label={t.kind} hint={t.kinds[text.kind]}>
              {isHost ? (
                <Segment
                  label={t.kind}
                  values={TEXT_KINDS}
                  names={t.kindsShort}
                  value={text.kind}
                  onChange={(kind) => send({ kind })}
                />
              ) : (
                <Value>{t.kindsShort[text.kind]}</Value>
              )}
            </Row>
            <Row label={t.wordCountShort} hint={t.wordCountHint}>
              {isHost ? (
                <Stepper
                  label={t.wordCountShort}
                  value={text.wordCount}
                  step={5}
                  limits={LIMITS.wordCount}
                  less={t.less}
                  more={t.more}
                  onChange={(wordCount) => send({ wordCount })}
                />
              ) : (
                <Value>{text.wordCount}</Value>
              )}
            </Row>
            <Row label={t.complexity}>
              {isHost ? (
                <Segment
                  label={t.complexity}
                  values={COMPLEXITIES}
                  names={levels}
                  value={text.complexity}
                  onChange={(complexity) => send({ complexity })}
                />
              ) : (
                <Value>{levels[text.complexity]}</Value>
              )}
            </Row>
            <div className="grid sm:grid-cols-2 sm:gap-x-8">
              {(["punctuation", "numbers", "capitals", "accents"] as const)
                .filter((option) => option !== "accents" || text.language === "FR")
                .map((option) => (
                  <Row key={option} label={t[option]}>
                    {isHost ? (
                      <Switch
                        label={t[option]}
                        checked={text[option]}
                        onChange={(on) => send({ [option]: on })}
                      />
                    ) : (
                      <Value>{yes(text[option])}</Value>
                    )}
                  </Row>
                ))}
            </div>
            {text.kind === "RANDOM" && (
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {(["include", "exclude"] as const).map((field) =>
                  isHost ? (
                    <label key={field} className="flex flex-col gap-1.5 font-bold">
                      {t[field]}
                      <input
                        key={text[field]}
                        type="text"
                        maxLength={LIMITS.chars}
                        defaultValue={text[field]}
                        aria-describedby={`${id}-aide-car`}
                        autoComplete="off"
                        spellCheck={false}
                        onBlur={(e) => {
                          if (e.currentTarget.value !== text[field])
                            send({ [field]: e.currentTarget.value });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className="border-trait bg-surface focus:border-bleu min-h-11 rounded-xl border-2 px-3 font-mono font-normal transition"
                      />
                    </label>
                  ) : (
                    <Row key={field} label={t[field]}>
                      <Value>{text[field] || "—"}</Value>
                    </Row>
                  ),
                )}
                {isHost && (
                  <p id={`${id}-aide-car`} className="text-sourdine text-sm sm:col-span-2">
                    {t.charsHelp}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {tab === "race" && (
          <>
            <Row label={t.errorMode}>
              {isHost ? (
                <Segment
                  label={t.errorMode}
                  values={["STRICT", "FREE"] as const}
                  names={t.errorModesShort}
                  value={config.errorMode}
                  onChange={(errorMode) => send({ errorMode })}
                />
              ) : (
                <Value>{t.errorModesShort[config.errorMode]}</Value>
              )}
            </Row>
            <Row label={t.timeLimit} hint={t.timeLimitHint}>
              {isHost ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="seg" role="group" aria-label={t.timeLimit}>
                    <button
                      type="button"
                      aria-pressed={seconds === null}
                      onClick={() => send({ timeLimitSec: null })}
                    >
                      {t.noLimit}
                    </button>
                    {PRESET_SECONDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={seconds === s}
                        onClick={() => send({ timeLimitSec: s })}
                      >
                        {s} s
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-pressed={customTime}
                      onClick={() => customTime || send({ timeLimitSec: 180 })}
                    >
                      {t.timeOther}
                    </button>
                  </div>
                  {customTime && (
                    <Stepper
                      label={t.seconds}
                      value={seconds}
                      step={10}
                      limits={LIMITS.timeLimitSec}
                      less={t.less}
                      more={t.more}
                      onChange={(timeLimitSec) => send({ timeLimitSec })}
                    />
                  )}
                </div>
              ) : (
                <Value>{seconds === null ? t.noLimit : `${seconds} s`}</Value>
              )}
            </Row>
            <Row label={t.bonuses} hint={t.bonusesHint}>
              {isHost ? (
                <Switch
                  label={t.bonuses}
                  checked={config.bonuses}
                  onChange={(bonuses) => send({ bonuses })}
                />
              ) : (
                <Value>{yes(config.bonuses)}</Value>
              )}
            </Row>
          </>
        )}

        {tab === "room" && (
          <>
            <Row label={t.visibility} hint={t.visibilities[config.visibility]}>
              {isHost ? (
                <Segment
                  label={t.visibility}
                  values={VISIBILITIES}
                  names={t.visibilitiesShort}
                  value={config.visibility}
                  onChange={(visibility) => send({ visibility })}
                />
              ) : (
                <Value>{t.visibilitiesShort[config.visibility]}</Value>
              )}
            </Row>
            <Row label={t.maxPlayersShort} hint={t.maxPlayersHint}>
              {isHost ? (
                <Stepper
                  label={t.maxPlayersShort}
                  value={config.maxPlayers}
                  step={1}
                  limits={LIMITS.maxPlayers}
                  less={t.less}
                  more={t.more}
                  onChange={(maxPlayers) => send({ maxPlayers })}
                />
              ) : (
                <Value>{config.maxPlayers}</Value>
              )}
            </Row>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-faute font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}

// Une ligne de réglage : le nom (et une aide) à gauche, le contrôle à droite.
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="ligne-reglage">
      <span className="font-bold">
        {label}
        {hint && <span className="text-sourdine mt-0.5 block text-[13px] font-medium">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return (
    <span className="bg-surface-2 rounded-xl px-3 py-1.5 font-mono font-bold">{children}</span>
  );
}

// Choix unique parmi quelques valeurs : boutons à bascule (aria-pressed).
function Segment<T extends string>({
  label,
  values,
  names,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  names: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => v !== value && onChange(v)}
        >
          {names[v]}
        </button>
      ))}
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="switch"
    />
  );
}

// − valeur + ; la valeur reste un champ qu'on peut taper, envoyé en le
// quittant (ou avec Entrée), pas à chaque touche.
function Stepper({
  label,
  value,
  step,
  limits,
  less,
  more,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  limits: { min: number; max: number };
  less: string;
  more: string;
  onChange: (value: number) => void;
}) {
  const commit = (field: HTMLInputElement) => {
    const next = clamp(Number(field.value), limits);
    if (Number.isNaN(Number(field.value)) || next === value) field.value = String(value);
    else onChange(next);
  };
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`${less} (${label})`}
        disabled={value <= limits.min}
        onClick={() => onChange(clamp(value - step, limits))}
      >
        −
      </button>
      <input
        key={value}
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={limits.min}
        max={limits.max}
        step={step}
        defaultValue={value}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      <button
        type="button"
        aria-label={`${more} (${label})`}
        disabled={value >= limits.max}
        onClick={() => onChange(clamp(value + step, limits))}
      >
        +
      </button>
    </div>
  );
}
