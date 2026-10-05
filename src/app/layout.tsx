import type { Metadata } from "next";
import { Big_Shoulders, Figtree, Martian_Mono } from "next/font/google";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Touché", template: "%s · Touché" },
  description: "Duels de frappe au clavier en direct pour les 12 à 17 ans. Chaque touche compte.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${bigShoulders.variable} ${figtree.variable} ${martianMono.variable} h-full antialiased`}
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
          className="bg-cta text-cta-encre sr-only rounded-md px-3 py-2 text-sm font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
