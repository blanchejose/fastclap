"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { BACKSPACE, type ErrorMode, type Typing } from "@/lib/race/typing";

type Props = {
  text: string;
  typing: Typing;
  active: boolean;
  mode: ErrorMode;
  onKey: (key: string) => void;
  t: Dictionary["race"];
};

// Zone de frappe (COURSE-04) : retour immédiat lettre par lettre, coller
// désactivé. Un champ invisible reçoit le clavier ; le texte affiché est
// colorié selon ce qui a été tapé.
export function TypingZone({ text, typing, active, mode, onKey, t }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  // Effacer passe par le clavier : le champ reste toujours vide.
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onKey(BACKSPACE);
  }

  // Les caractères passent par l'événement « input » plutôt que par les
  // touches : il reçoit aussi les lettres composées (touches mortes ^ ¨,
  // méthodes de saisie), qui n'ont pas toujours de touche à elles.
  function takeInput(field: HTMLInputElement) {
    const chars = field.value;
    field.value = "";
    for (const char of chars) onKey(char);
  }

  function onInput(event: React.FormEvent<HTMLInputElement>) {
    if ((event.nativeEvent as InputEvent).isComposing) return;
    takeInput(event.currentTarget);
  }

  const block = (event: React.SyntheticEvent) => event.preventDefault();
  const cursor = typing.typed.length;

  return (
    <section aria-labelledby="titre-texte" className="hidden flex-col gap-3 md:flex">
      <h2 id="titre-texte" className="sr-only">
        {t.textLabel}
      </h2>
      <div
        className="bg-surface-2 focus-within:ring-focus relative cursor-text rounded-2xl px-5 py-4 focus-within:ring-[3px]"
        onClick={() => inputRef.current?.focus()}
      >
        <p
          aria-hidden="true"
          className="font-mono text-xl leading-[1.9] break-words whitespace-pre-wrap"
        >
          {[...text].map((char, i) => {
            let className = "text-sourdine";
            if (i < cursor)
              className =
                typing.typed[i] === char
                  ? "text-juste"
                  : "text-faute bg-faute/15 underline decoration-wavy";
            else if (i === cursor && active)
              className = "bg-jaune/50 text-encre rounded-sm shadow-[inset_3px_0_0_var(--orange)]";
            return (
              <span key={i} className={className}>
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
      <p id="consigne-mode" className="text-sourdine text-sm">
        {mode === "STRICT" ? t.modeStrict : t.modeFree} {t.focusHint}
      </p>
    </section>
  );
}
