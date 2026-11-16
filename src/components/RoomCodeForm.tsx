import { joinByCode } from "@/app/salle/actions";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  t: Dictionary["code"];
  error?: "invalide" | "introuvable" | "prive" | "trop";
  note?: string;
};

// Formulaire sans JavaScript : il appelle une Server Action (JOIN-01).
export function RoomCodeForm({ t, error, note }: Props) {
  return (
    <form
      id="rejoindre"
      action={joinByCode}
      className="carte flex max-w-[29rem] flex-col gap-2.5 p-[18px]"
    >
      <label htmlFor="code-salle" className="text-[15px] font-bold">
        {t.label}
      </label>
      <div className="flex gap-2">
        <input
          id="code-salle"
          name="code"
          required
          autoComplete="off"
          placeholder="K7X-2QP"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-erreur" : undefined}
          className={`bg-surface-2 placeholder:text-sourdine focus:border-bleu focus:bg-surface min-h-[52px] w-0 min-w-0 flex-1 rounded-[14px] border-2 px-4 font-mono text-xl font-bold tracking-[0.18em] uppercase transition-colors outline-none ${error ? "border-faute" : "border-trait"}`}
        />
        <button type="submit" className="btn btn-bleu min-h-[52px] rounded-[14px]">
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
      {note && (
        <p className="text-sourdine flex items-center gap-2 text-sm">
          <svg
            viewBox="0 0 24 24"
            className="text-juste size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          {note}
        </p>
      )}
    </form>
  );
}
