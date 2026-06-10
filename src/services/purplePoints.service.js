'use strict';

const { sql } = require('../config/db');
const { PP_TYPES, earnAmount } = require('../constants/purplePointTypes');
const { getCatalogItem, isFreeItem } = require('../constants/mercadoCatalog');

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Crea la fila de saldo del usuario si todavía no existe.
 * Seguro de llamar múltiples veces (ON CONFLICT DO NOTHING).
 */
async function ensureBalanceRow(idUsuario) {
  await sql`
    INSERT INTO public."Usuario_Purple_Points" (id_usuario, saldo)
    VALUES (${idUsuario}, 0)
    ON CONFLICT (id_usuario) DO NOTHING
  `;
}

/**
 * Obtiene el saldo actual. Devuelve 0 si la fila aún no existe.
 */
async function getSaldo(idUsuario) {
  const rows = await sql`
    SELECT saldo FROM public."Usuario_Purple_Points" WHERE id_usuario = ${idUsuario}
  `;
  return rows.length > 0 ? rows[0].saldo : 0;
}

/**
 * Acredita puntos de forma idempotente.
 * Si ya existe una transacción con el mismo (id_reserva, tipo) la omite silenciosamente.
 * Devuelve el saldo actualizado.
 */
async function creditOrSkip({ idUsuario, tipo, monto, idReserva = null, itemId = null, descripcion = null }) {
  await ensureBalanceRow(idUsuario);
  try {
    await sql`
      INSERT INTO public."Purple_Points_Transaccion"
        (id_usuario, tipo, monto, id_reserva, item_id, descripcion)
      VALUES
        (${idUsuario}, ${tipo}, ${monto}, ${idReserva}, ${itemId}, ${descripcion})
    `;
    await sql`
      UPDATE public."Usuario_Purple_Points"
         SET saldo = saldo + ${monto},
             actualizado_en = NOW()
       WHERE id_usuario = ${idUsuario}
    `;
  } catch (err) {
    // Código 23505 = unique_violation (índice idx_pp_trans_reserva_tipo)
    if (err.code !== '23505') throw err;
    // Transacción ya registrada → saltar sin error
  }
  return getSaldo(idUsuario);
}

// ─── Ganancias por reserva ───────────────────────────────────────────────────

/**
 * Otorga PP al crear una reserva.
 * Idempotente: seguro de llamar varias veces con el mismo id_reserva.
 */
async function earnForReservationCreate(idUsuario, idReserva, tipoReserva, descripcion) {
  const monto = earnAmount(PP_TYPES.EARN_CREATE, tipoReserva);
  const desc = descripcion ?? `Reserva #${idReserva} creada`;
  return creditOrSkip({
    idUsuario,
    tipo: PP_TYPES.EARN_CREATE,
    monto,
    idReserva,
    descripcion: desc,
  });
}

/**
 * Otorga bonus de PP al completar check-out.
 * @param {object} reservaRow - Fila completa de "Reserva" devuelta por RETURNING *.
 */
async function earnForCheckout(reservaRow) {
  const { id_usuario, id_reserva, tipo_reserva } = reservaRow;
  const monto = earnAmount(PP_TYPES.EARN_CHECKOUT, tipo_reserva);
  const desc = `Check-out reserva #${id_reserva}`;
  return creditOrSkip({
    idUsuario: id_usuario,
    tipo: PP_TYPES.EARN_CHECKOUT,
    monto,
    idReserva: id_reserva,
    descripcion: desc,
  });
}

// ─── Balance y historial ─────────────────────────────────────────────────────

/**
 * Devuelve { balance, equipped, inventory } para inicializar el frontend.
 */
async function getBalanceBundle(idUsuario) {
  await ensureBalanceRow(idUsuario);

  const [balanceRows, equippedRows, inventoryRows] = await Promise.all([
    sql`SELECT saldo FROM public."Usuario_Purple_Points" WHERE id_usuario = ${idUsuario}`,
    sql`SELECT tema_id, avatar_id, banner_id FROM public."Usuario_Equipamiento" WHERE id_usuario = ${idUsuario}`,
    sql`SELECT item_id FROM public."Usuario_Inventario" WHERE id_usuario = ${idUsuario}`,
  ]);

  const balance = balanceRows.length > 0 ? balanceRows[0].saldo : 0;
  const eq = equippedRows.length > 0 ? equippedRows[0] : { tema_id: null, avatar_id: null, banner_id: null };
  const inventory = inventoryRows.map((r) => r.item_id);

  return {
    balance,
    equipped: {
      temaId:   eq.tema_id   ?? null,
      avatarId: eq.avatar_id ?? null,
      bannerId: eq.banner_id ?? null,
    },
    inventory,
  };
}

/**
 * Devuelve historial paginado de transacciones del usuario.
 */
async function getTransactions(idUsuario, limit = 20, offset = 0) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const off = Math.max(Number(offset) || 0, 0);

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT id_transaccion, tipo, monto, descripcion, creado_en
        FROM public."Purple_Points_Transaccion"
       WHERE id_usuario = ${idUsuario}
       ORDER BY creado_en DESC
       LIMIT ${lim} OFFSET ${off}
    `,
    sql`
      SELECT COUNT(*)::int AS total
        FROM public."Purple_Points_Transaccion"
       WHERE id_usuario = ${idUsuario}
    `,
  ]);

  return {
    transactions: rows.map((r) => ({
      idTransaccion: r.id_transaccion,
      tipo:          r.tipo,
      monto:         r.monto,
      descripcion:   r.descripcion,
      creadoEn:      r.creado_en,
    })),
    total: countRows[0]?.total ?? 0,
  };
}

// ─── Mercado ─────────────────────────────────────────────────────────────────

/**
 * Compra un ítem del catálogo. Transacción atómica:
 * valida catálogo, verifica propiedad, comprueba saldo y descuenta.
 *
 * Devuelve { ok, status, newBalance, itemId } o { ok, status, message/error }.
 */
async function purchaseItem(idUsuario, itemId) {
  const catalogItem = getCatalogItem(itemId);
  if (!catalogItem) {
    return { ok: false, status: 400, message: 'Ítem no encontrado en el catálogo' };
  }

  await ensureBalanceRow(idUsuario);

  // Verificar propiedad previa
  const existing = await sql`
    SELECT 1 FROM public."Usuario_Inventario"
     WHERE id_usuario = ${idUsuario} AND item_id = ${itemId}
  `;
  if (existing.length > 0) {
    return { ok: false, status: 409, message: 'El ítem ya está en tu inventario' };
  }

  const precio = catalogItem.precio;

  // Obtener saldo actual y validar suficiencia
  const balanceRows = await sql`
    SELECT saldo FROM public."Usuario_Purple_Points" WHERE id_usuario = ${idUsuario}
  `;
  const current = balanceRows.length > 0 ? balanceRows[0].saldo : 0;

  if (current < precio) {
    return {
      ok: false,
      status: 402,
      error: 'insufficient_balance',
      required: precio,
      current,
    };
  }

  // Transacción atómica: descontar saldo + insertar inventario + registrar transacción
  await sql.transaction([
    sql`
      UPDATE public."Usuario_Purple_Points"
         SET saldo = saldo - ${precio},
             actualizado_en = NOW()
       WHERE id_usuario = ${idUsuario}
    `,
    sql`
      INSERT INTO public."Usuario_Inventario" (id_usuario, item_id, categoria)
      VALUES (${idUsuario}, ${itemId}, ${catalogItem.category})
    `,
    sql`
      INSERT INTO public."Purple_Points_Transaccion"
        (id_usuario, tipo, monto, item_id, descripcion)
      VALUES
        (${idUsuario}, ${PP_TYPES.PURCHASE}, ${-precio}, ${itemId}, ${'Compra: ' + itemId})
    `,
  ]);

  const newBalance = current - precio;
  return { ok: true, status: 201, newBalance, itemId };
}

/**
 * Equipa un ítem. Acepta itemId = null para desequipar la categoría.
 * Valida que el ítem esté en inventario o sea gratuito en el catálogo.
 *
 * Devuelve { ok, equipped } o { ok, status, message }.
 */
async function equipItem(idUsuario, itemId, category) {
  const VALID_CATEGORIES = ['theme', 'avatar', 'banner'];
  if (!VALID_CATEGORIES.includes(category)) {
    return { ok: false, status: 400, message: "category debe ser 'theme', 'avatar' o 'banner'" };
  }

  if (itemId !== null) {
    const catalogItem = getCatalogItem(itemId);
    if (!catalogItem) {
      return { ok: false, status: 400, message: 'Ítem no encontrado en el catálogo' };
    }

    const isOwned = isFreeItem(itemId)
      ? true
      : (
          await sql`
            SELECT 1 FROM public."Usuario_Inventario"
             WHERE id_usuario = ${idUsuario} AND item_id = ${itemId}
          `
        ).length > 0;

    if (!isOwned) {
      return { ok: false, status: 403, message: 'El ítem no está en tu inventario' };
    }
  }

  // Upsert en Usuario_Equipamiento según la columna correspondiente
  if (category === 'theme') {
    await sql`
      INSERT INTO public."Usuario_Equipamiento" (id_usuario, tema_id, actualizado_en)
      VALUES (${idUsuario}, ${itemId}, NOW())
      ON CONFLICT (id_usuario) DO UPDATE SET tema_id = ${itemId}, actualizado_en = NOW()
    `;
  } else if (category === 'avatar') {
    await sql`
      INSERT INTO public."Usuario_Equipamiento" (id_usuario, avatar_id, actualizado_en)
      VALUES (${idUsuario}, ${itemId}, NOW())
      ON CONFLICT (id_usuario) DO UPDATE SET avatar_id = ${itemId}, actualizado_en = NOW()
    `;
  } else {
    await sql`
      INSERT INTO public."Usuario_Equipamiento" (id_usuario, banner_id, actualizado_en)
      VALUES (${idUsuario}, ${itemId}, NOW())
      ON CONFLICT (id_usuario) DO UPDATE SET banner_id = ${itemId}, actualizado_en = NOW()
    `;
  }

  const rows = await sql`
    SELECT tema_id, avatar_id, banner_id
      FROM public."Usuario_Equipamiento"
     WHERE id_usuario = ${idUsuario}
  `;
  const eq = rows[0] ?? { tema_id: null, avatar_id: null, banner_id: null };

  return {
    ok: true,
    equipped: {
      temaId:   eq.tema_id   ?? null,
      avatarId: eq.avatar_id ?? null,
      bannerId: eq.banner_id ?? null,
    },
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/**
 * Ajuste manual de saldo por un administrador.
 * monto puede ser positivo (crédito) o negativo (débito), pero el saldo no puede bajar de 0.
 */
async function adminAdjust(idUsuario, monto, descripcion) {
  await ensureBalanceRow(idUsuario);

  const balanceRows = await sql`
    SELECT saldo FROM public."Usuario_Purple_Points" WHERE id_usuario = ${idUsuario}
  `;
  const current = balanceRows.length > 0 ? balanceRows[0].saldo : 0;

  if (current + monto < 0) {
    return {
      ok: false,
      status: 400,
      message: `El ajuste dejaría el saldo en negativo (saldo actual: ${current})`,
    };
  }

  await sql`
    UPDATE public."Usuario_Purple_Points"
       SET saldo = saldo + ${monto},
           actualizado_en = NOW()
     WHERE id_usuario = ${idUsuario}
  `;
  await sql`
    INSERT INTO public."Purple_Points_Transaccion"
      (id_usuario, tipo, monto, descripcion)
    VALUES
      (${idUsuario}, ${PP_TYPES.ADMIN_ADJUST}, ${monto}, ${descripcion ?? 'Ajuste manual'})
  `;

  const newBalance = current + monto;
  return { ok: true, newBalance };
}

module.exports = {
  ensureBalanceRow,
  earnForReservationCreate,
  earnForCheckout,
  getBalanceBundle,
  getTransactions,
  purchaseItem,
  equipItem,
  adminAdjust,
};
