import { cookies } from "next/headers";
import { dictionaries, type Locale } from "./dictionaries";

// La langue choisie est gardée dans le cookie « locale » (français par défaut).
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value === "en" ? "en" : "fr";
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
