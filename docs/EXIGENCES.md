# Exigences — choix documentés

L'énoncé demande de faire un choix raisonnable quand une exigence est ambiguë
ou incomplète, et de le documenter ici (section 2.2). Ce document réunit ces
choix, regroupés par thème. La **matrice de traçabilité** (où chaque exigence
est réalisée et comment elle est vérifiée) est dans [`MATRICE.md`](MATRICE.md).

## Course

- **MPM (annexe A).** Un mot vaut 5 caractères, espaces compris. MPM net :
  caractères justes à leur place ÷ 5 ÷ minutes. MPM brut : toutes les touches de
  caractère ÷ 5 ÷ minutes. Précision : touches justes ÷ touches pressées. Une
  faute corrigée reste comptée.
- **Mode libre.** Le joueur avance sur une faute et peut l'effacer avec Retour
  arrière. Il arrive quand il a couvert tout le texte, même avec des fautes
  laissées derrière : elles baissent son MPM net et sa précision.
- **Vitesse irréaliste (COURSE-06).** Le serveur refuse un lot de plus de 30
  touches, plus de 50 touches en 2 secondes, ou une moyenne de plus de 25
  touches par seconde depuis le départ (≈ 300 MPM, au-delà de tout humain), avec
  10 touches de marge pour la latence. Un lot refusé n'est pas appliqué : le
  serveur renvoie son état et le navigateur s'y aligne.
- **Absence.** Le délai de 30 s de COURSE-08 s'applique aussi en salle
  d'attente : une personne partie depuis 30 s est retirée de la salle, et si
  c'était l'hôte, le rôle passe au plus ancien humain connecté (SALLE-08).
- **Choix du texte.** Le texte est tiré au hasard parmi ceux du niveau de la
  salle. Une salle passe par tous les textes de son niveau avant d'en reprendre
  un, et ne court jamais deux fois de suite le même texte.

La machine à états (COURSE-01) est décrite dans
[`ARCHITECTURE.md`](ARCHITECTURE.md), section 2.

## Salles et comptes

- **Salle pleine.** Une personne qui entre dans une salle pleine y entre comme
  spectatrice (les spectateurs ne comptent pas dans la capacité).
- **Rôle.** Chaque personne humaine (pas seulement l'hôte) choisit entre « Je
  cours » et « Je regarde » dans la salle d'attente.

Légende : ✅ fait · 🟡 en partie · ⏳ à faire (livraison finale)

- **Invités (AUTH-02).** Le cookie `fastclap_invite` contient un identifiant
  aléatoire (128 bits) et le pseudo, signés avec `AUTH_SECRET` (HMAC-SHA256) ;
  il dure 30 jours, en `httpOnly` et `SameSite=Lax`. Un invité qui change de
  pseudo garde le même identifiant. Le pseudo suit les mêmes règles qu'un nom
  d'utilisateur ; il n'a pas à être unique, et l'interface affiche « invité » à
  côté pour éviter la confusion avec un compte.
- **Hôte et invités (SALLE-08).** « La personne humaine connectée » est
  comprise comme un utilisateur avec un compte : un invité ne peut pas créer de
  salle (AUTH-03), il ne devient donc jamais hôte. S'il ne reste que des
  invités, la salle est fermée.
- **Liens d'invitation (SALLE-04).** Le jeton fait 256 bits (32 octets
  aléatoires en base64url). À la première ouverture, le lien est lié à la
  personne (compte ou invité) et à son adresse IP. Ensuite, il ne marche que
  pour cette personne depuis la même adresse : une autre adresse est refusée,
  et une autre personne derrière la même adresse (même réseau d'école) aussi.
  La liaison se fait par une mise à jour conditionnelle en base : deux personnes
  qui ouvrent le lien en même temps ne peuvent pas l'obtenir toutes les deux.
- **Adresse IP.** Derrière le proxy de Railway, l'adresse arrive dans un
  en-tête. On ne le croit que si la variable `TRUST_PROXY_HEADER` le nomme
  (`x-real-ip` sur Railway) ; sinon, c'est l'adresse de la connexion.
  `server.ts` calcule l'adresse et remplace l'en-tête interne `x-fastclap-ip`,
  pour qu'un visiteur ne puisse pas l'inventer.
- **Salle privée.** Le serveur temps réel décide qui entre : l'hôte, les
  personnes déjà dans la salle (reconnexion, ou salle devenue privée après leur
  arrivée) et celles qui ont un lien valide. Sans lien, la page affiche un
  message au lieu du formulaire d'invité, et le formulaire de code de l'accueil
  explique que la salle est privée.
- **Une salle à la fois (SALLE-06).** La table `RoomPresence` a une ligne au
  plus par personne (compte ou invité) : sa clé primaire est l'identifiant de
  la personne, donc PostgreSQL refuse une deuxième ligne, même si deux onglets
  essaient en même temps. Les spectateurs comptent aussi. La présence est
  libérée quand la personne quitte, est expulsée, reste absente plus de 30 s
  ou quand la salle ferme. Les salles vivant en mémoire, le serveur efface
  toutes les présences à son démarrage. Si une présence pointe vers une salle
  où la personne n'est plus (reste d'un arrêt brutal), elle est remplacée.
- **Limite d'essais (SALLE-10).** On compte les essais **ratés** (code mal
  formé, salle introuvable ou fermée) par adresse IP : sur le formulaire de
  l'accueil, à l'adresse `/salle/CODE` et par le serveur temps réel. Après 10
  essais en une minute, plus aucun code ne s'ouvre depuis cette adresse
  jusqu'à la fin de la fenêtre glissante, même un bon code, pour ne rien
  révéler. Une personne déjà dans une salle peut toujours s'y reconnecter. Le
  compteur est en mémoire, partagé entre Next.js et Socket.IO par `globalThis`
  (un seul serveur). Limite connue : toute une classe derrière la même adresse
  partage le compteur.

## Configuration de la course

- **Options en mode cohérent (CONF-06).** On ne peut pas ajouter de ponctuation
  ou de nombres à un vrai passage. Une option désactivée retire donc ce qu'elle
  concerne : ponctuation (sauf les apostrophes et les traits d'union dans les
  mots), majuscules (tout en minuscules), accents (lettres sans accent, œ → oe).
  Sans nombres, les passages qui n'en contiennent pas sont choisis en premier.
- **Caractères à inclure ou à exclure (CONF-07).** Réglage du texte aléatoire
  seulement : en mode cohérent, il est désactivé, pour ne pas abîmer les vrais
  passages. Exclure : aucun mot ni signe ajouté ne contient ces caractères.
  Inclure : seuls les mots qui contiennent au moins un de ces caractères sont
  gardés. Si un filtre laisse moins de 5 mots, il est ignoré pour que la course
  reste possible.
- **Longueur en mode cohérent (CONF-04).** Les passages du niveau choisi sont
  enchaînés (ceux pas encore courus d'abord) jusqu'à la longueur demandée, puis
  le texte est coupé au bon nombre de mots. Si le niveau ne suffit pas, on
  complète avec les passages des autres niveaux de la même langue.
- **Quand changer la configuration.** Dans la salle d'attente seulement. Sur
  l'écran des résultats, « Nouvelle course » ramène en salle d'attente, où l'hôte
  modifie la configuration avant de relancer (COURSE-11).
- **Capacité.** Elle ne peut pas descendre sous le nombre actuel de participants.

La configuration est gardée en base (colonnes de `Room`) : elle survit à un
redémarrage du serveur.

### Critères de complexité (CONF-05)

**Texte aléatoire.** Les dictionnaires sont classés du mot le plus fréquent au
moins fréquent.

| Complexité | Mots permis                                                                                     | Nombres (option) |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| Facile     | Les 150 mots les plus fréquents, de 5 lettres au plus                                           | 1 à 99           |
| Moyen      | Tous les mots fréquents, de 8 lettres au plus                                                   | 1 à 999          |
| Difficile  | Tous les mots fréquents et une liste de mots rares et longs ; ponctuation plus variée (! ? ; :) | 1 à 9999         |

**Texte cohérent.** Chaque passage reçoit un score calculé par `textScore` :
longueur moyenne des mots (en lettres) + 10 × proportion de caractères
spéciaux (majuscules, chiffres, ponctuation, lettres accentuées) parmi les
caractères non blancs. Facile : score < 5 ; moyen : 5 à 6 ; difficile : ≥ 6.
Le seed recalcule ce classement à chaque déploiement.

## Bots

Les valeurs des cinq niveaux (BOT-01 : MPM visé, taux d'erreur) et le
comportement des bots (variations, hésitations, fautes, graine) sont décrits
dans [`ARCHITECTURE.md`](ARCHITECTURE.md), section 4.

## Bonus de remontée

- **Règle des bonus (BONUS-01).** La progression d'un coureur est la part de
  **son** texte déjà tapée. Le meneur est le coureur le plus avancé, arrivés
  compris. Les points de contrôle sont atteints quand il passe 25 %, 50 % et
  75 % ; chacun ne compte qu'une fois par course (s'il en passe deux d'un coup,
  les deux sont distribués). À chaque point, est « en retard » tout coureur
  encore en course, autre que le meneur, qui est soit le moins avancé, soit à
  25 points de pourcentage ou plus derrière le meneur. Chacun reçoit un bonus,
  tant qu'il en a reçu moins de 3 dans la course.
- **Types de bonus (BONUS-02).** Le type est tiré au hasard, avec une graine
  propre à la course (testable). −3 mots : les 3 derniers mots du texte du
  joueur en retard disparaissent, sans jamais toucher à ce qu'il a déjà tapé ;
  s'il avait déjà tapé tout le reste, il arrive. +3 mots : 3 mots tirés du texte
  de la course sont ajoutés au texte du meneur. Brouillard : la fin du mot en
  cours et les 3 mots suivants du meneur sont flous pendant 5 s. Le meneur ne
  subit qu'un +3 mots et un brouillard par point de contrôle (sinon, à 30
  joueurs, il en recevrait des dizaines) : un tirage en trop devient −3 mots.
  Si le meneur est déjà arrivé, seuls des −3 mots sont distribués.
- **Cohérence (BONUS-04).** Chaque coureur a son propre texte dans le moteur.
  Le serveur rejoue les touches sur ce texte, calcule la progression sur sa
  longueur et le MPM sur les caractères justes tapés ; il envoie le nouveau
  texte au joueur concerné (`race:mytext`) sans toucher à sa frappe.

## Rejoindre une course

- **Salles montrées (JOIN-02).** Les salles publiques ouvertes où au moins une
  personne est connectée : une salle vide n'a personne pour lancer la course.
  Les données (participants, état, configuration) viennent de la mémoire du
  serveur temps réel, partagée avec Next.js par `globalThis` (un seul serveur).
  Les participants comptent les bots, pas les spectateurs. Une salle en course
  reste visible, avec son état, mais on n'y entre qu'aux résultats (SALLE-09).
- **Mise à jour (JOIN-02).** Le navigateur redemande la liste toutes les 3 s à
  `/api/salles`, avec les filtres de langue et de complexité (validés par Zod).
- **Partie rapide (JOIN-03).** « La plus proche de sa capacité maximale » est
  comprise comme la salle à qui il reste le **moins de places libres**, parmi
  les salles publiques en attente ou aux résultats et pas pleines ; à égalité,
  la plus ancienne. Sans salle libre : un utilisateur connecté voit le message
  et un bouton pour créer une salle publique avec la configuration par défaut ;
  un invité voit le message et un lien vers les salles.

## Résultats et historique

- **Historique (HIST-01, HIST-02).** 10 courses par page, de la plus récente à
  la plus ancienne ; un numéro de page invalide revient à la page 1 ou à la
  dernière. Les abandons y figurent aussi. La page d'une course n'est ouverte
  qu'aux utilisateurs qui l'ont courue (les autres reçoivent une page
  introuvable) ; elle réaffiche le même écran que la fin de course, graphiques
  compris, à partir de la base.

- **Ce qui est gardé (RES-05).** À la fin de chaque course, une seule écriture
  en base (jamais pendant la frappe) : la course (texte, langue, heures) et
  chaque participant, avec son classement, MPM, MPM brut, précision, fautes,
  temps, statut, bonus reçus, courbe du MPM (un point par seconde, plus un point
  final) et fautes par touche attendue. Les invités et les bots sont gardés
  aussi, pour réafficher le tableau complet (HIST-02), mais le résultat n'est
  lié à un compte (donc à un historique) que pour un utilisateur connecté.
- **Record personnel (RES-04).** Un MPM plus haut que le meilleur MPM des
  courses précédentes que la personne a **terminées**. La première course
  terminée est un record. Un abandon ou un temps écoulé n'en est jamais un.
- **Graphiques (RES-03).** Une couleur par coureur, attribuée par couloir (la
  couleur suit la personne, jamais son rang) ; palette catégorielle de 8
  couleurs vérifiée par le script de validation dans les deux thèmes (contraste,
  séparation pour le daltonisme). Au-delà de 8 coureurs, les suivants sont
  gris. Le joueur local a un trait plus épais. Légende, étiquettes en bout de
  ligne (4 coureurs ou moins), infobulle au survol et tableau des données
  (lisible au clavier et au lecteur d'écran). Clavier QWERTY (claviers
  canadiens) en une seule teinte du clair au foncé, avec le nombre de fautes
  écrit sur chaque touche ; les caractères absents du clavier (accents,
  guillemets) ont leur propre rangée.

## Profil

- **Statistiques (AUTH-06).** Le meilleur MPM, le MPM moyen, la précision
  moyenne et la courbe de progression comptent les courses **terminées** (un
  abandon à 0 MPM ne dit rien de la vitesse). Le nombre de courses compte aussi
  les abandons. Une victoire est une 1re place à l'arrivée. La courbe montre les
  50 dernières courses terminées.
- **Pseudonyme (AUTH-05).** Il est gardé à part (`User.name`) : le nom
  d'utilisateur qui sert à se connecter ne change pas, sinon un compte avec mot
  de passe perdrait son identifiant. 3 à 20 caractères : lettres (accents
  compris), chiffres, espaces, apostrophe, tiret et tiret bas ; il n'a pas à
  être unique. Il s'affiche dans le menu, la salle et les résultats des courses
  suivantes (une course passée garde le nom du moment).
- **Photo (AUTH-04, SEC-02).** Le serveur vérifie la taille (2 Mo au plus) et
  le **vrai type** dans les premiers octets du fichier (signatures JPEG, PNG,
  WebP) ; le nom du fichier et le type annoncé par le navigateur sont ignorés.
  L'image est ensuite recadrée en carré de 256 px, convertie en WebP sans
  métadonnées (`sharp`), et gardée en base : le disque du serveur Railway est
  effacé à chaque déploiement, et un service d'images externe ajouterait un
  compte et un coût (TECH-08). Le navigateur vérifie aussi la taille avant
  l'envoi, pour éviter de téléverser une grosse image pour rien.
