import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomCodeForm } from "@/components/RoomCodeForm";
import { RoomList } from "@/components/RoomList";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Salles" };

export default function PublicRoomsPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pt-12 pb-16"
      >
        <h1 className="font-display text-6xl leading-[0.92] font-extrabold tracking-tight">
          Salles ouvertes
        </h1>
        <p className="text-sourdine max-w-[40em] text-lg">
          Les salles publiques sont listées ici. Pour une salle de classe, demande le code à ton
          enseignant ou à ton ami.
        </p>
        <RoomCodeForm />
        <Suspense fallback={<p className="text-sourdine">Chargement des salles…</p>}>
          <RoomList limit={30} />
        </Suspense>
      </main>
    </>
  );
}
