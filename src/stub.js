// Configuration proposée quand on ajoute la carte depuis le sélecteur de cartes.
export const STUB = {
  title: "Ma maison",
  rooms: [
    { id: "sejour", name: "Séjour", kind: "jour", rect: [0, 0, 6, 4.5] },
    { id: "cuisine", name: "Cuisine", kind: "jour", rect: [6, 0, 10, 3] },
    { id: "sdb", name: "Salle de bain", kind: "eau", rect: [6, 3, 10, 4.5] },
    { id: "ch1", name: "Chambre 1", kind: "nuit", rect: [0, 4.5, 5, 8] },
    { id: "ch2", name: "Chambre 2", kind: "nuit", rect: [5, 4.5, 10, 8] },
  ],
  openings: [
    { type: "door", from: [2, 0], to: [2.9, 0], swing: "down" },
    { type: "open", from: [6, 1], to: [6, 2.6] },
    { type: "door", from: [7, 3], to: [7.7, 3] },
    { type: "door", from: [3.6, 4.5], to: [4.4, 4.5] },
    { type: "door", from: [5.6, 4.5], to: [6.4, 4.5] },
    { type: "window", from: [0, 1], to: [0, 3] },
    { type: "window", from: [7.5, 0], to: [9, 0] },
    { type: "window", from: [1, 8], to: [3, 8] },
    { type: "window", from: [7, 8], to: [9, 8] },
  ],
  zones: [{ id: "terrasse", name: "Terrasse", type: "deck", rect: [0, 8, 6, 10.5] }],
  devices: [],
  furniture: [
    { type: "canape", x: 0.4, y: 0.4 },
    { type: "tableronde", x: 3.6, y: 2.2 },
    { type: "lit2", x: 1.5, y: 5.2 },
    { type: "lit1", x: 8.5, y: 5.6 },
  ],
};
