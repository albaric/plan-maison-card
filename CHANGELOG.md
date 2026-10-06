# Journal des versions

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
