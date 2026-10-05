import { joinByCode } from "@/app/salle/actions";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = { t: Dictionary["code"]; error?: "invalide" | "introuvable" };

// Formulaire sans JavaScript : il appelle une Server Action (ROOM-1).
export function RoomCodeForm({ t, error }: Props) {
  return (
    <form id="rejoindre" action={joinByCode} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="code-salle" className="text-[15px] font-semibold">
          {t.label}
        </label>
        <input
          id="code-salle"
          name="code"
          required
          autoComplete="off"
          placeholder="K7X-2QP"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-erreur" : undefined}
          className={`bg-surface placeholder:text-sourdine min-h-12 w-40 rounded-xl border-2 px-3.5 font-mono text-lg font-semibold tracking-widest uppercase ${error ? "border-faute" : "border-encre"}`}
        />
        <button
          type="submit"
          className="border-encre hover:bg-encre hover:text-piste min-h-12 rounded-xl border-2 px-5 text-[15px] font-bold transition"
        >
          {t.submit}
        </button>
      </div>
      {error && (
        <p
          id="code-erreur"
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
          {t[error]}
        </p>
      )}
    </form>
  );
}
