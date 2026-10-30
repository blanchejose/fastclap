import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Locale, PrismaClient } from "../src/generated/prisma/client";
import { classifyText } from "../src/lib/text/generate";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Corpus de départ : quelques phrases simples, puis des passages d'œuvres du
// domaine public (CONF-03, mode cohérent).
// La complexité n'est pas choisie à la main : elle est calculée par
// classifyText (CONF-05, critères dans docs/EXIGENCES.md).
const texts: { content: string; language: Locale }[] = [
  {
    content: "Le chat dort sur le canapé pendant que la pluie tombe doucement sur la ville.",
    language: "FR",
  },
  {
    content:
      "Un élève pressé traverse la cour, ouvre son ordinateur et tape sa réponse avant la cloche.",
    language: "FR",
  },
  {
    content:
      "Après des heures d'entraînement, Zoé dépasse enfin 90 mots par minute ; son clavier, épuisé, réclame une pause méritée !",
    language: "FR",
  },
  {
    content: "The quick brown fox jumps over the lazy dog near the quiet river bank.",
    language: "EN",
  },
  {
    content:
      "Every great programmer started by typing slowly, one careful key at a time, before learning to fly.",
    language: "EN",
  },
  {
    content:
      "Rien ne sert de courir ; il faut partir à point. Le lièvre et la tortue en sont un témoignage.",
    language: "FR",
  },
  {
    content:
      "Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l'odeur alléché, lui tint à peu près ce langage.",
    language: "FR",
  },
  {
    content:
      "En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.",
    language: "FR",
  },
  {
    content:
      "La Cigale, ayant chanté tout l'été, se trouva fort dépourvue quand la bise fut venue.",
    language: "FR",
  },
  {
    content:
      "La raison du plus fort est toujours la meilleure : nous l'allons montrer tout à l'heure.",
    language: "FR",
  },
  {
    content:
      "Demain, dès l'aube, à l'heure où blanchit la campagne, je partirai. Vois-tu, je sais que tu m'attends.",
    language: "FR",
  },
  {
    content:
      "Souvent, pour s'amuser, les hommes d'équipage prennent des albatros, vastes oiseaux des mers, qui suivent, indolents compagnons de voyage, le navire glissant sur les gouffres amers.",
    language: "FR",
  },
  {
    content:
      "C'est un trou de verdure où chante une rivière, accrochant follement aux herbes des haillons d'argent ; où le soleil, de la montagne fière, luit : c'est un petit val qui mousse de rayons.",
    language: "FR",
  },
  {
    content:
      "Les sanglots longs des violons de l'automne blessent mon cœur d'une langueur monotone.",
    language: "FR",
  },
  {
    content:
      "Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n'avais pas le temps de me dire : « Je m'endors. »",
    language: "FR",
  },
  {
    content:
      "Once upon a time there were four little Rabbits, and their names were Flopsy, Mopsy, Cotton-tail, and Peter.",
    language: "EN",
  },
  {
    content:
      "Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition, seemed to unite some of the best blessings of existence.",
    language: "EN",
  },
  {
    content:
      "Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint and curious volume of forgotten lore.",
    language: "EN",
  },
  {
    content:
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.",
    language: "EN",
  },
  {
    content:
      "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    language: "EN",
  },
  {
    content:
      "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little.",
    language: "EN",
  },
];

async function main() {
  // Le seed tourne à chaque déploiement : il ajoute les textes absents et
  // recalcule la complexité de tous, au cas où les critères ont changé.
  let added = 0;
  for (const text of texts) {
    const data = {
      ...text,
      difficulty: classifyText(text.content),
      wordCount: text.content.split(/\s+/).length,
    };
    const existing = await prisma.text.findFirst({ where: { content: text.content } });
    if (existing) {
      await prisma.text.update({ where: { id: existing.id }, data });
    } else {
      await prisma.text.create({ data: { ...data, source: "CORPUS" } });
      added++;
    }
  }
  console.log(`${added} textes ajoutés, ${texts.length - added} mis à jour.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
