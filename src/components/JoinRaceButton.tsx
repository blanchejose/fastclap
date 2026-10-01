"use client";

import { useState } from "react";

// Composant client : il réagit au clic. La recherche de la prochaine course
// (HOME-2) sera branchée ici quand Socket.IO sera en place.
export function JoinRaceButton() {
  const [searching, setSearching] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setSearching(true)}
      disabled={searching}
      className="bg-eclair font-display text-nuit focus-visible:outline-turbo w-full max-w-md rounded-2xl px-8 py-6 text-3xl font-bold tracking-wide uppercase shadow-[0_6px_28px_rgba(252,130,1,0.35)] transition hover:scale-[1.02] focus-visible:outline-3 focus-visible:outline-offset-4 disabled:opacity-80"
    >
      {searching ? "Recherche d'une course…" : "Rejoindre une course"}
    </button>
  );
}
