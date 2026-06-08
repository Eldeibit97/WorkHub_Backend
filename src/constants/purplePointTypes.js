/** Tipos de transacción permitidos en purple_points_transaccion. */
const PP_TYPES = {
  EARN_CREATE:   'EARN_CREATE',
  EARN_CHECKOUT: 'EARN_CHECKOUT',
  PURCHASE:      'PURCHASE',
  ADMIN_ADJUST:  'ADMIN_ADJUST',
};

/**
 * Montos de PP por evento y tipo_reserva.
 * Si tipo_reserva no coincide con ningún caso conocido se usa INDIVIDUAL como fallback.
 */
const EARN_AMOUNTS = {
  EARN_CREATE: {
    INDIVIDUAL:      50,
    ESTACIONAMIENTO: 30,
  },
  EARN_CHECKOUT: {
    INDIVIDUAL:      25,
    ESTACIONAMIENTO: 15,
  },
};

/**
 * Devuelve los PP a otorgar dado el tipo de transacción y el tipo_reserva.
 * Fallback a INDIVIDUAL para valores desconocidos.
 */
function earnAmount(tipoTransaccion, tipoReserva) {
  const table = EARN_AMOUNTS[tipoTransaccion];
  if (!table) return 0;
  const normalized = String(tipoReserva || '').toUpperCase();
  return table[normalized] ?? table['INDIVIDUAL'];
}

module.exports = { PP_TYPES, EARN_AMOUNTS, earnAmount };
