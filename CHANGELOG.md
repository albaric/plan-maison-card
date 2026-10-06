# Journal des versions

## 1.8.1

- Caméras : nouvelle icône (caméra sur son support, objectif, champ de vision qui balaie, voyant d'enregistrement) en bleu quand elle fonctionne. Une caméra « idle » dans Home Assistant est en marche : elle s'affiche « En ligne » (ou « Enregistre », « En direct ») au lieu de « En veille ».
- Température : couleur continue selon la valeur (bleu glacé, bleu, turquoise, vert, jaune, orange, rouge), appliquée au thermomètre, à la pastille et au chiffre ; même principe pour l'humidité.
- Guirlandes allumées : halo lumineux diffus, scintillement des ampoules par couleur et filament blanc ; éteintes, les ampoules sont ternes.
- Pluviomètre plus lisible : nuage et bocal contrastés, gouttes plus grandes, niveau visible dès quelques millimètres (bocal plein vers 30 mm), pastille teintée en bleu quand il a plu.

## 1.8.0

- Nouveaux meubles : escalier droit et escalier quart tournant (pour les maisons à étage), voiture et vélo (pour le garage). 77 meubles au catalogue.
- La surface déclarée d'une pièce (`area`, celle du plan de l'architecte par exemple) s'affiche sur le plan et dans le panneau à la place de la surface calculée ; sans `area`, la surface calculée reste affichée avec « ≈ ».

## 1.7.1

- Toucher une terrasse, la pergola ou une pièce liste aussi les guirlandes qui y sont accrochées, avec leur interrupteur ; survoler la ligne surligne la guirlande sur le plan. Elles comptent dans le nombre d'équipements de chaque pièce ou espace.

## 1.7.0

- Mobilier entièrement redessiné : un dessin propre à chaque meuble, avec ses détails et des couleurs vives (vaisselle sur la table, livres sur l'étagère, ordinateur sur le bureau, couette et plaid sur le lit, serviettes et canard dans le bain…).
- 73 meubles rangés par pièce dans la bibliothèque (salon, repas, chambre, bureau, cuisine, salle de bain, jardin). Nouveautés : cuisine équipée, plan de travail, cuisine d'angle, îlot avec tabourets, bar, évier double, plaque de cuisson, frigo américain, lave-vaisselle ; meuble double vasque, sèche-serviettes, tapis de bain ; poêle, cheminée, table basse ronde, table et chaises ; chevet, fauteuil de bureau ; piscine, spa, pergola en glycine, potager, massif fleuri, lavandes, haie, olivier, palmier, arbre fruitier, pot de fleurs, salon et table de jardin, brasero, hamac, trampoline, robot tondeuse.
- Meubles redimensionnables dans l'éditeur (largeur et profondeur) : plans de travail, piscine, potager, haie, tapis, lits… Les tissus changent de couleur (14 teintes), dans l'éditeur comme sur la carte.
- Éditeur : un bouton « Illustrer » remplace les meubles dessinés avec de simples formes par les illustrations du catalogue, à la même place et à la même taille (lits et canapés orientés d'après leurs oreillers ou leur dossier, évier et plaques posés sur les plans de travail, tabourets séparés).
- Les espaces extérieurs « piscine » et « massif, potager » sont dessinés (eau, bouée, fleurs, rangs de légumes).

## 1.6.0

- Nouveau widget humidité : une goutte qui se remplit selon le taux d'humidité, avec une vague animée, une couleur qui va de l'orange (air sec) au bleu profond (air humide) et des bulles au-delà de 65 %. Il s'applique automatiquement aux capteurs d'humidité.
- Carte étroite (colonne d'un tableau de bord en sections, téléphone) : le panneau « Vue d'ensemble » passe sous le plan, hors de vue. Toucher une pièce ou une zone ouvre maintenant sa fiche directement sur le plan (relevés, équipements avec leurs interrupteurs) ; « Fermer » revient à la vue d'ensemble. En largeur normale, le panneau latéral se met à jour comme avant.
- Relevés du panneau : une lecture seule occupe toute la largeur.

## 1.5.3

- Correction de la 1.5.2 : les widgets météo (température, vent, pluie, pression) redevenaient de simples icônes quand une icône leur était associée. Ils restent prioritaires ; `widget: false` permet d'afficher l'icône à la place.

## 1.5.2

- Un capteur avec unité (onduleur, puissance, mémoire…) dont on a choisi l'icône affiche désormais cette icône animée sur le plan, avec la valeur dans une pastille dessous. Avant, l'icône choisie dans l'éditeur était ignorée et seule la valeur s'affichait.
- Sur la carte, la fiche d'un équipement affiché en valeur propose aussi la bibliothèque d'icônes ; « Revenir à la valeur » annule ce choix.
- `kind: value` reste respecté si on veut la valeur seule.

## 1.5.1

- Correction : dans Home Assistant, après une première modification, l'onglet Bandeau ne réagissait plus (ajout d'une deuxième tuile, titre, ordre, suppression) et l'onglet Réglages non plus. Home Assistant verrouille la configuration que l'éditeur lui transmet ; l'éditeur lui envoie désormais une copie.
- Le banc d'essai de l'éditeur verrouille la configuration comme Home Assistant, et teste l'enchaînement ajout, renommage, déplacement et suppression de tuiles.

## 1.5.0

- Icônes animées entièrement redessinées, en couleur : 46 icônes (14 nouvelles : borne de recharge, porte de garage, serrure, sonnette, thermostat, pompe à chaleur, purificateur, piscine, lave-linge, réfrigérateur, four, cafetière, aspirateur, enceinte).
- Chaque famille d'appareils a sa couleur (lumière, ouvrants, sécurité, chauffage, eau, cuisine, multimédia, réseau…) : une pastille active prend cette couleur avec un halo qui pulse ; une pastille éteinte est désaturée pour faire ressortir ce qui marche.
- Animations plus vivantes : l'ampoule rayonne, la porte et le garage s'ouvrent, la serrure se déverrouille, l'aspirateur roule, le lave-linge tourne, la cafetière fume, l'enceinte vibre, le robinet coule…
- Mobilier illustré : bois veiné, tissus avec coussins, lits avec oreillers et couette, céramique et eau pour la salle de bain, plan de travail en pierre, plaques de cuisson, électroménager avec hublot, feuillages qui ondulent, braises du barbecue, halo du lampadaire. Rendu adapté au thème sombre.
- La bibliothèque de mobilier (carte et éditeur) montre les mêmes illustrations.

## 1.4.1

- Bandeau de l'éditeur revu : un bouton « + Ajouter une tuile » ouvre la recherche du capteur ; chaque tuile est une fiche avec sa valeur actuelle, son titre, sa ligne secondaire (avec aperçu) et ses boutons monter / descendre / supprimer.
- La valeur d'un autre capteur s'insère dans la ligne secondaire de la tuile choisie (bouton propre à chaque tuile), au lieu d'un champ commun qui prêtait à confusion avec l'ajout de tuile.

## 1.4.0

- Éditeur : outil « Guirlande » pour tracer une guirlande lumineuse point par point (zigzag, ligne…) et la relier à l'interrupteur ou à la lumière qui la commande, choisi par son nom.
- Les guirlandes existantes s'affichent dans l'éditeur ; on les déplace, on glisse ou ajoute leurs points d'accroche, on règle les ampoules (multicolores façon guinguette ou blanc chaud) et l'affaissement.
- Sur la carte, la guirlande s'illumine quand l'appareil est allumé et un clic l'allume ou l'éteint (une guirlande pas encore reliée n'a plus d'effet au clic).
- Le type d'appareil s'affiche sous le nom dans le sélecteur, sans chevaucher le texte.

## 1.3.0

- Les appareils se choisissent par leur nom courant : on tape « lampe salon » et on choisit dans la liste (nom, type d'appareil et pièce Home Assistant). Les identifiants techniques (`light.xxx`) n'apparaissent plus, ni dans l'éditeur (Équipements, Bandeau, panneau d'un équipement) ni dans la carte (ajout en mode Équipements, listes du panneau latéral).
- Bandeau : un sélecteur insère la valeur d'un autre capteur dans la ligne secondaire.

## 1.2.0

- Pièces de forme libre : outil « Forme libre » pour dessiner une pièce coin par coin, avec alignement automatique à l'horizontale et à la verticale.
- Bouton « + » au milieu de chaque mur de la pièce sélectionnée : ajoute un coin et le tire aussitôt.
- Un coin touché se règle au centimètre ou se supprime depuis le panneau.
- Le clavier (R, Suppr, Ctrl+Z) reste actif après un ajout depuis le panneau.

## 1.1.0

- **Éditeur visuel** dans la fenêtre « Modifier la carte » : dessin des pièces à la souris avec aimantation et cotes, portes, fenêtres et ouvertures posées sur les murs, espaces extérieurs, coins et murs déplaçables (les pièces voisines suivent), formes en L, zoom, annulation.
- Onglets Équipements (ajout, placement, icône animée), Bandeau et Réglages.
- Mobilier ajouté, déplacé et pivoté depuis l'éditeur.
- Les réglages faits sur la carte (enregistrés par utilisateur) peuvent être intégrés à la configuration en un clic.
- Un plan vide est accepté (message d'invitation à le dessiner).
- Correctif : les raccourcis clavier du mode Mobilier ne fonctionnaient plus.

## 1.0.0

Première version générique.

- Plan entièrement décrit en configuration : pièces en mètres, axes nommés ou automatiques, murs déduits des pièces.
- Mode Murs générique : poignée par cloison, poussée des cloisons voisines, tableau des surfaces.
- Portes avec arc et libellé, passages, fenêtres ; zones extérieures (terrasse, pergola, abri, piscine, gravier) ; jardin avec arbres automatiques.
- 32 icônes animées avec bibliothèque, widgets météo (température, vent, pluie, pression), guirlandes lumineuses.
- Mobilier coloré, catalogue de 36 meubles.
- Bandeau de tuiles configurable, alertes automatiques et règles personnalisées.
- Export de la configuration avec la disposition courante.
