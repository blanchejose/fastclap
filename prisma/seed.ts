import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Difficulty, Locale, PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Corpus de départ : quelques phrases simples, puis des passages d'œuvres du
// domaine public (CONF-03, mode cohérent).
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
  {
    content:
      "Rien ne sert de courir ; il faut partir à point. Le lièvre et la tortue en sont un témoignage.",
    language: "FR",
    difficulty: "BEGINNER",
  },
  {
    content:
      "Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l'odeur alléché, lui tint à peu près ce langage.",
    language: "FR",
    difficulty: "INTERMEDIATE",
  },
  {
    content:
      "En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.",
    language: "FR",
    difficulty: "PRO",
  },
  {
    content:
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.",
    language: "EN",
    difficulty: "BEGINNER",
  },
  {
    content:
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    language: "EN",
    difficulty: "INTERMEDIATE",
  },
  {
    content:
      "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little.",
    language: "EN",
    difficulty: "PRO",
  },
];

async function main() {
  // Le seed tourne à chaque déploiement : on n'ajoute que les textes absents.
  let added = 0;
  for (const text of texts) {
    const existing = await prisma.text.findFirst({ where: { content: text.content } });
    if (existing) continue;
    await prisma.text.create({
      data: { ...text, source: "CORPUS", wordCount: text.content.split(/\s+/).length },
    });
    added++;
  }
  console.log(`${added} textes ajoutés, ${texts.length - added} déjà présents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
