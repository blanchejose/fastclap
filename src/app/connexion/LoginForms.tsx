"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { signInWithPassword, signInWithUsername, type LoginState } from "./actions";

type Props = { next: string; t: Dictionary["login"] };

const initial: LoginState = { error: null };

// Champ de saisie de la maquette : fond doux, bordure qui passe au bleu au focus.
export const fieldClass =
  "bg-surface-2 text-encre placeholder:text-sourdine focus:border-bleu focus:bg-surface h-[52px] w-full rounded-[14px] border-2 px-4 text-[17px] font-semibold transition-colors outline-none";

export function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="text-faute flex items-center gap-2 text-[15px] font-semibold"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6M12 17h.01" />
      </svg>
      {children}
    </p>
  );
}

// Message traduit d'un code d'erreur d'Auth.js.
export function loginMessage(code: string, t: Dictionary["login"]): string {
  return (t.errors as Record<string, string>)[code] ?? t.errors.other;
}

// Connexion rapide : un pseudo suffit. L'erreur s'affiche sous le champ, sans
// recharger la page ; le pseudo tapé reste.
export function UsernameForm({ next, t }: Props) {
  const [{ error, username }, action, pending] = useActionState(signInWithUsername, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="suite" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="pseudo" className="text-[15px] font-bold">
          {t.pseudo}
        </label>
        <input
          id="pseudo"
          name="username"
          defaultValue={username}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_\-]{3,20}"
          autoComplete="username"
          placeholder={t.pseudoPlaceholder}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "pseudo-aide pseudo-erreur" : "pseudo-aide"}
          className={`${fieldClass} ${error ? "border-faute!" : "border-trait"}`}
        />
        <span id="pseudo-aide" className="text-sourdine text-[13px]">
          {t.pseudoHelp}
        </span>
        {error && <ErrorText id="pseudo-erreur">{loginMessage(error, t)}</ErrorText>}
      </div>
      <button type="submit" aria-busy={pending} disabled={pending} className="btn-go p-4 text-xl">
        {t.go}
        <svg
          className="fleche"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}

// AUTH-01 : mot de passe, disponible mais en retrait (en dernier, replié).
// Un <details> s'ouvre sans JavaScript ; il reste ouvert après une erreur.
export function PasswordForm({ next, t }: Props) {
  const [{ error, username }, action, pending] = useActionState(signInWithPassword, initial);
  return (
    <details open={!!error || undefined} className="group flex flex-col">
      <summary className="text-bleu-texte mx-auto flex min-h-11 cursor-pointer list-none items-center px-2 font-bold [&::-webkit-details-marker]:hidden">
        {t.hasPassword}
      </summary>
      <form
        action={action}
        className="border-trait motion-safe:animate-monte mt-2 flex flex-col gap-3.5 border-t pt-4"
      >
        <input type="hidden" name="suite" value={next} />
        <div className="flex flex-col gap-2">
          <label htmlFor="mdp-pseudo" className="text-[15px] font-bold">
            {t.username}
          </label>
          <input
            id="mdp-pseudo"
            name="username"
            defaultValue={username}
            required
            autoComplete="username"
            className={`${fieldClass} border-trait`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="mdp" className="text-[15px] font-bold">
            {t.password}
          </label>
          <input
            id="mdp"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "mdp-erreur" : undefined}
            className={`${fieldClass} ${error ? "border-faute!" : "border-trait"}`}
          />
          {error && <ErrorText id="mdp-erreur">{loginMessage(error, t)}</ErrorText>}
        </div>
        <button type="submit" aria-busy={pending} disabled={pending} className="btn btn-bleu">
          {t.submitPassword}
        </button>
      </form>
    </details>
  );
}
