# Journal des versions

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
