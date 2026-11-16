"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { EMPTY_FIELD, eraseField, readField, type FieldState } from "@/lib/race/input";
import type { ErrorMode, Typing } from "@/lib/race/typing";

type Props = {
  text: string;
  typing: Typing;
  active: boolean;
  mode: ErrorMode;
  fogged: boolean; // BONUS-02 : brouillard sur les prochains mots
  onKey: (key: string) => void;
  t: Dictionary["race"];
};

// Zone de frappe (COURSE-04) : retour immédiat lettre par lettre, coller
// désactivé. Un champ invisible reçoit le clavier ; le texte affiché est
// colorié selon ce qui a été tapé.
export function TypingZone({ text, typing, active, mode, fogged, onKey, t }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const fieldRef = useRef<FieldState>(EMPTY_FIELD);

  function send(field: HTMLInputElement, result: { keys: string[]; state: FieldState }) {
    fieldRef.current = result.state;
    field.value = result.state.value;
    for (const key of result.keys) onKey(key);
  }

  // Effacer passe par le clavier, pour ne jamais vider le champ par erreur.
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send(event.currentTarget, eraseField(fieldRef.current));
  }

  // Les caractères passent par l'événement « input » plutôt que par les
  // touches : il reçoit aussi les lettres composées (touches mortes ^ ¨,
  // bulle d'accents du Mac, méthodes de saisie), qui n'ont pas toujours de
  // touche à elles.
  function takeInput(field: HTMLInputElement) {
    send(field, readField(fieldRef.current, field.value, text[typing.typed.length]));
  }

  function onInput(event: React.FormEvent<HTMLInputElement>) {
    if ((event.nativeEvent as InputEvent).isComposing) return;
    takeInput(event.currentTarget);
  }

  const block = (event: React.SyntheticEvent) => event.preventDefault();
  const cursor = typing.typed.length;
  // Fin du brouillard : la fin du mot en cours, puis les trois mots suivants.
  let fogEnd = cursor;
  for (let words = 0; fogged && fogEnd < text.length && words < 4; fogEnd++)
    if (text[fogEnd] === " " && fogEnd > cursor) words++;

  return (
    <section
      aria-labelledby="titre-texte"
      className="carte border-bleu! motion-safe:animate-monte hidden flex-col overflow-hidden border-2 shadow-[0_6px_0_var(--bleu)] [animation-delay:80ms] focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-[var(--focus)] md:flex"
    >
      <h2 id="titre-texte" className="sr-only">
        {t.textLabel}
      </h2>
      <div
        className="relative cursor-text px-6 py-7 transition-colors sm:px-9 sm:py-8"
        onClick={() => inputRef.current?.focus()}
      >
        <p aria-hidden="true" className="texte-course break-words whitespace-pre-wrap">
          {[...text].map((char, i) => {
            let className = "";
            if (i < cursor)
              className = typing.typed[i] === char ? "ok" : "ko"; // couleur + soulignement
            else if (i === cursor && active) className = "cur";
            if (i > cursor && i < fogEnd) className += " brouillard";
            return (
              <span key={i} className={className || undefined}>
                {char}
              </span>
            );
          })}
        </p>
        <input
          ref={inputRef}
          aria-label={t.textLabel}
          aria-describedby="texte-complet consigne-mode"
          className="absolute inset-0 size-full cursor-text opacity-0"
          disabled={!active}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          defaultValue=""
          onKeyDown={onKeyDown}
          onInput={onInput}
          onCompositionEnd={(event) => takeInput(event.currentTarget)}
          onPaste={block}
          onDrop={block}
          onCut={block}
        />
        <span id="texte-complet" className="sr-only">
          {text}
        </span>
      </div>
      <p
        id="consigne-mode"
        className="border-trait text-sourdine border-t px-6 py-3.5 text-sm sm:px-9"
      >
        {mode === "STRICT" ? t.modeStrict : t.modeFree} {t.focusHint}
      </p>
    </section>
  );
}
