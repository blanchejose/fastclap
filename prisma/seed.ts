import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Difficulty, Locale, PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Corpus de départ (TEXT-1 : les textes viendront ensuite d'une API ou d'un corpus généré).
const texts: { content: string; language: Locale; difficulty: Difficulty }[] = [
  {
    content: "Le chat dort sur le canapé pendant que la pluie tombe doucement sur la ville.",
    language: "FR",
    difficulty: "BEGINNER",
  },
  {
    content:
      "Un élève pressé traverse la cour, ouvre son ordinateur et tape sa réponse avant la cloche.",
    language: "FR",
    difficulty: "INTERMEDIATE",
  },
  {
    content:
      "Après des heures d'entraînement, Zoé dépasse enfin 90 mots par minute ; son clavier, épuisé, réclame une pause méritée !",
    language: "FR",
    difficulty: "PRO",
  },
  {
    content: "The quick brown fox jumps over the lazy dog near the quiet river bank.",
    language: "EN",
    difficulty: "BEGINNER",
  },
  {
    content:
      "Every great programmer started by typing slowly, one careful key at a time, before learning to fly.",
    language: "EN",
    difficulty: "INTERMEDIATE",
  },
];

async function main() {
  await prisma.text.deleteMany({ where: { source: "CORPUS", races: { none: {} } } });
  await prisma.text.createMany({
    data: texts.map((t) => ({
      ...t,
      source: "CORPUS" as const,
      wordCount: t.content.split(/\s+/).length,
    })),
  });
  console.log(`${texts.length} textes ajoutés.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
