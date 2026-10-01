import type { Metadata } from "next";
import { JetBrains_Mono, Nunito, Rajdhani } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FastClap",
  description: "Tape plus rapide que tes amis : courses de frappe au clavier en temps réel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${rajdhani.variable} ${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applique le thème enregistré avant l'affichage pour éviter un flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
