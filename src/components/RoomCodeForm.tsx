import { joinByCode } from "@/app/salle/actions";

const messages = {
  invalide: "Un code a 6 caractères, par exemple K7X-2QP.",
  introuvable: "Aucune salle ouverte avec ce code. Vérifie avec ton ami.",
} as const;

type Props = { error?: keyof typeof messages };

// Formulaire sans JavaScript : il appelle une Server Action.
export function RoomCodeForm({ error }: Props) {
  return (
    <form id="rejoindre" action={joinByCode} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="code-salle" className="text-[15px] font-semibold">
          Un ami t&apos;a donné un code ?
        </label>
        <input
          id="code-salle"
          name="code"
          required
          autoComplete="off"
          placeholder="K7X-2QP"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-erreur" : undefined}
          className={`bg-surface placeholder:text-sourdine min-h-12 w-40 rounded-md border-2 px-3.5 font-mono text-lg font-semibold tracking-widest uppercase ${error ? "border-faute" : "border-encre"}`}
        />
        <button
          type="submit"
          className="border-encre hover:bg-encre hover:text-piste min-h-12 rounded-md border-2 px-5 text-[15px] font-bold transition"
        >
          Entrer
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
          {messages[error]}
        </p>
      )}
    </form>
  );
}
