"use client";

import { useId, useState } from "react";

type Props = {
  label: string;
  question: string;
  yes: string;
  no: string;
  onConfirm: () => void;
};

// Action qu'on ne peut pas annuler (abandonner, fermer la salle) : un premier
// clic pose la question, un second confirme (COURSE-07).
export function ConfirmButton({ label, question, yes, no, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  const questionId = useId();

  if (!asking)
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="text-faute self-start font-bold underline underline-offset-4"
      >
        {label}
      </button>
    );

  return (
    <div
      role="alertdialog"
      aria-labelledby={questionId}
      className="flex flex-wrap items-center gap-3"
    >
      <p id={questionId} className="font-semibold">
        {question}
      </p>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="border-faute text-faute bg-surface min-h-11 rounded-xl border-2 px-4 font-bold"
      >
        {yes}
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setAsking(false)}
        className="bg-surface-2 min-h-11 rounded-xl px-4 font-bold"
      >
        {no}
      </button>
    </div>
  );
}
