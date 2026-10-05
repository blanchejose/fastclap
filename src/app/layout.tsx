import type { Metadata } from "next";
import localFont from "next/font/local";
import { getDictionary, getLocale } from "@/i18n/server";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

// Polices hébergées dans le projet (src/fonts, licence SIL OFL) : aucun
// téléchargement chez Google au démarrage, donc le même rendu partout.
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
});

const figtree = localFont({
  src: "../fonts/figtree.woff2",
  variable: "--font-figtree",
  weight: "300 900",
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: { default: "FastClap", template: "%s · FastClap" },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${bricolage.variable} ${figtree.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applique le thème choisi avant l'affichage pour éviter un flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenu"
          className="bg-jaune text-nuit sr-only rounded-md px-3 py-2 text-sm font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50"
        >
          {t.common.skip}
        </a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
