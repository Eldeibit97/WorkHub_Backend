/**
 * Espejo mínimo del catálogo del Mercado.
 * Debe mantenerse sincronizado con workhub-mty/src/data/mercadoCatalog.js.
 * En v2 esto vendrá de una tabla en BD para actualizarse sin redeploy.
 */
const CATALOG_ITEMS = [
  // Temas
  { id: 'dracula',   category: 'theme',  precio: 200 },
  { id: 'neon',      category: 'theme',  precio: 300 },
  { id: 'abyssal',   category: 'theme',  precio: 250 },
  { id: 'amethyst',  category: 'theme',  precio: 350 },
  // Avatares
  { id: 'avatar-01', category: 'avatar', precio: 100 },
  { id: 'avatar-02', category: 'avatar', precio: 100 },
  { id: 'avatar-03', category: 'avatar', precio: 150 },
  { id: 'avatar-04', category: 'avatar', precio: 150 },
  { id: 'avatar-05', category: 'avatar', precio: 200 },
  { id: 'avatar-06', category: 'avatar', precio: 200 },
  // Banners
  { id: 'banner-01', category: 'banner', precio: 150 },
  { id: 'banner-02', category: 'banner', precio: 150 },
  { id: 'banner-03', category: 'banner', precio: 200 },
  { id: 'banner-04', category: 'banner', precio: 250 },
];

/** Búsqueda O(1) por id. */
const CATALOG_BY_ID = Object.fromEntries(CATALOG_ITEMS.map((item) => [item.id, item]));

/** Devuelve el ítem del catálogo o undefined si no existe. */
function getCatalogItem(id) {
  return CATALOG_BY_ID[id];
}

/** Devuelve true si el ítem existe en el catálogo y su precio es 0. */
function isFreeItem(id) {
  const item = CATALOG_BY_ID[id];
  return item !== undefined && item.precio === 0;
}

module.exports = { CATALOG_ITEMS, CATALOG_BY_ID, getCatalogItem, isFreeItem };
