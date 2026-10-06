// Catalogue de mobilier (unités internes : décimètres)
export const CAT = {
  lit2: ["Lit double", [["r", 0, 0, 16, 20, .6], ["r", 1, 1, 6.5, 4, .6], ["r", 8.5, 1, 6.5, 4, .6]]], lit1: ["Lit simple", [["r", 0, 0, 9, 19, .6], ["r", 1, 1, 7, 4, .6]]],
  canape: ["Canapé", [["r", 0, 0, 18, 7, 1.2], ["r", 0, 0, 18, 2, .6]]], fauteuil: ["Fauteuil", [["r", 0, 0, 7, 7, 1.2], ["r", 0, 0, 7, 2, .6]]],
  table: ["Table", [["r", 0, 0, 8, 14, .4]]], tableronde: ["Table ronde", [["c", 5, 5, 5]]], chaise: ["Chaise", [["c", 1.6, 1.6, 1.6]]],
  armoire: ["Armoire", [["r", 0, 0, 10, 6, .3], ["l", 5, 0, 5, 6]]], bureau: ["Bureau", [["r", 0, 0, 12, 6, .3]]], commode: ["Commode", [["r", 0, 0, 10, 5, .3]]],
  meubletv: ["Meuble TV", [["r", 0, 0, 12, 3.5, .3]]], lavelinge: ["Lave-linge", [["r", 0, 0, 6, 6, .3], ["c", 3, 3, 2]]], frigo: ["Réfrigérateur", [["r", 0, 0, 6.5, 6.5, .3], ["l", 0, 5.5, 6.5, 5.5]]],
  plante: ["Plante", [["c", 2, 2, 2], ["c", 2, 2, .8]]], tapis: ["Tapis", [["e", 7, 4, 7, 4]]], transat: ["Transat", [["r", 0, 0, 6, 18, 1], ["r", 0, 0, 6, 5, 1]]]
};
const CATX = {
  litbebe: ["Lit bébé", [["r", 0, 0, 7, 13, .4], ["r", .8, .8, 5.4, 11.4, .4]]],
  canapeangle: ["Canapé d'angle", [["r", 0, 0, 22, 7, 1.2], ["r", 0, 0, 22, 2, .6], ["r", 0, 0, 7, 18, 1.2], ["r", 0, 0, 2, 18, .6]]],
  pouf: ["Pouf", [["c", 2.5, 2.5, 2.5]]],
  tablebasse: ["Table basse", [["r", 0, 0, 10, 5, .8]]],
  tapisrond: ["Tapis rond", [["c", 6, 6, 6]]],
  biblio: ["Bibliothèque", [["r", 0, 0, 12, 3.5, .2], ["l", 3, 0, 3, 3.5], ["l", 6, 0, 6, 3.5], ["l", 9, 0, 9, 3.5]]],
  lampadaire: ["Lampadaire", [["c", 1.8, 1.8, 1.8], ["c", 1.8, 1.8, .6]]],
  tvx: ["Télévision", [["r", 0, 0, 12, 1.2, .2]]],
  grandeplante: ["Grande plante", [["c", 3.5, 3.5, 3.5], ["c", 3.5, 3.5, 1.2]]],
  piano: ["Piano", [["r", 0, 0, 15, 6, .3], ["r", 0, 4, 15, 2, .1]]],
  four: ["Cuisinière", [["r", 0, 0, 6, 6, .3], ["c", 1.7, 1.7, 1], ["c", 4.3, 1.7, 1], ["c", 1.7, 4.3, 1], ["c", 4.3, 4.3, 1]]],
  evier: ["Évier", [["r", 0, 0, 8, 5, .3], ["r", 1, 1, 6, 3, .6]]],
  seche: ["Sèche-linge", [["r", 0, 0, 6, 6, .3], ["c", 3, 3, 2]]],
  lavabo: ["Lavabo", [["r", 0, 0, 5, 4, .8], ["e", 2.5, 2.2, 1.6, 1.2]]],
  wcx: ["WC", [["e", 2.4, 7, 2.4, 3.2], ["r", .4, 0, 4, 2, .3]]],
  douchex: ["Douche", [["r", 0, 0, 9, 9, .4], ["c", 4.5, 4.5, .6]]],
  baignoirex: ["Baignoire", [["r", 0, 0, 8, 17, 2], ["r", 1, 1, 6, 15, 1.8]]],
  radiateurx: ["Radiateur", [["r", 0, 0, 8, 1.2, .2]]],
  barbecue: ["Barbecue", [["c", 3, 3, 3], ["c", 3, 3, 2]]],
  parasol: ["Parasol", [["c", 7, 7, 7], ["l", 0, 7, 14, 7], ["l", 7, 0, 7, 14], ["l", 2, 2, 12, 12], ["l", 12, 2, 2, 12]]]
};
Object.assign(CAT, CATX);
export const FSTYLE = { lit2: "bed", lit1: "bed", litbebe: "bed", canape: "sofa", canapeangle: "sofa", fauteuil: "sofa", pouf: "sofa", table: "wood", tableronde: "wood", tablebasse: "wood", chaise: "wood", armoire: "wood", bureau: "wood", commode: "wood", meubletv: "wood", biblio: "wood", lavelinge: "app", seche: "app", frigo: "app", plante: "plant", grandeplante: "plant", tapis: "rug", tapisrond: "rug", transat: "garden", lampadaire: "lamp", tvx: "tv", piano: "piano", four: "counter", evier: "counter", lavabo: "ceramic", wcx: "ceramic", douchex: "shower", baignoirex: "bath", radiateurx: "metal", barbecue: "stove", parasol: "parasol" };
