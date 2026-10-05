import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { getDictionary, getLocale } from "@/i18n/server";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
