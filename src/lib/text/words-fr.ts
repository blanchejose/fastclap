// Dictionnaire français du mode aléatoire (CONF-03), du mot le plus fréquent
// au moins fréquent. Le rang sert de critère de complexité (CONF-05).
export const FR_COMMON = `
le de un être et à il avoir ne je son que se qui ce dans en du elle au pour pas
que vous par sur faire plus dire me on mon lui nous comme mais pouvoir avec tout
y aller voir en bien où sans tu ou leur homme si deux mari moi vouloir te femme
venir quand grand celui notre devoir là jour prendre même votre rien petit encore
aussi quelque dont tout mer trouver donner temps ça peu même falloir sous parler
alors main chose ton mettre vie savoir yeux passer autre après regarder toujours
puis jamais cela aimer non heure croire cent monde donc enfant fois seul autre
entendre ami père mère bon tête mot tenir femme vers rester depuis nuit porte
pied premier chez dieu sortir nouveau rendre maison connaître penser vieux faire
ciel eau terre air feu arbre fleur soleil lune vent pluie neige mer route ville
école classe livre page lettre table chaise porte fenêtre rue chat chien oiseau
cheval poisson pain lait café fruit pomme jardin forêt montagne rivière plage
rouge bleu vert jaune noir blanc gris rose chaud froid beau joli vite lent fort
doux dur long court haut bas loin près ici demain hier matin soir midi semaine
année mois minute moment ligne course jeu équipe joueur gagner perdre courir
sauter marcher jouer lire écrire chanter danser manger boire dormir rire pleurer
ouvrir fermer partir arriver monter descendre tomber chercher garder laisser
apprendre comprendre répondre demander appeler montrer suivre vivre mourir
travail argent histoire question raison idée force voix bruit silence lumière
ombre chemin voyage pays mur bras dos cœur esprit corps visage regard sourire
musique image photo film carte clavier écran souris touche texte phrase vitesse
`
  .trim()
  .split(/\s+/);

// Mots plus rares ou plus longs, réservés au niveau difficile.
export const FR_RARE = `
anticonstitutionnellement quintessence éphémère kaléidoscope chrysanthème
labyrinthe hippopotame xylophone périphérique onomatopée paradoxalement
incontestablement extraordinaire bibliothèque phénomène architecture psychologie
mélancolique cacophonie ornithologue dithyrambique pérégrination sérendipité
abasourdi zéphyr rhododendron ambiguïté hétéroclite inextricable intrinsèque
obséquieux prolixe ubiquité vicissitude escarmouche flamboyant hyperbole
saugrenu tergiverser imperturbable effervescence chuchotement emberlificoter
`
  .trim()
  .split(/\s+/);
