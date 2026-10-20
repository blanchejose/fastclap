import { cookies, headers } from "next/headers";
import { dictionaries, type Locale } from "./dictionaries";

// La langue choisie est gardée dans le cookie « locale ». Sans choix, on suit
// la langue préférée du navigateur, puis le français (I18N-02).
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  if (value === "en" || value === "fr") return value;
  const accepted = (await headers()).get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const language = part.trim().slice(0, 2).toLowerCase();
    if (language === "en" || language === "fr") return language;
  }
  return "fr";
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
