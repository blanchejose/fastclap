import { Runner } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";

// Écran de chargement des pages qui lisent la base (loading.tsx de Next.js) : l'en-tête
// reste en place et un coureur traverse son couloir. Il n'apparaît qu'après un
// court délai, pour ne pas clignoter quand la page arrive vite.
export async function PageLoading() {
  const t = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main
        id="contenu"
        data-chargement
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-5 px-6 py-24"
      >
        <div
          aria-hidden="true"
          className="motion-safe:animate-monte relative h-12 w-full max-w-sm overflow-hidden [animation-delay:250ms]"
        >
          <span className="border-trait absolute inset-x-0 top-11 border-t-2 border-dashed" />
          <span className="text-orange motion-safe:animate-traverse absolute top-0 size-11 [animation-duration:2.4s]">
            <Runner className="size-11" />
          </span>
        </div>
        <p
          role="status"
          className="text-sourdine motion-safe:animate-monte font-bold [animation-delay:250ms]"
        >
          {t.common.loading}
        </p>
      </main>
    </>
  );
}
