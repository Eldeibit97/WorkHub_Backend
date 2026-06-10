'use strict';

const ppService = require('../services/purplePoints.service');
const { isValidPgInt32, parsePgIntId } = require('../utils/pgInt');

// GET /api/purple-points/balance
async function getBalance(req, res) {
  try {
    const idUsuario = req.user.sub;
    const bundle = await ppService.getBalanceBundle(idUsuario);
    return res.status(200).json(bundle);
  } catch (err) {
    console.error('getBalance', err);
    return res.status(500).json({ message: 'Error al obtener el saldo' });
  }
}

// GET /api/purple-points/transactions?limit=20&offset=0
async function getTransactions(req, res) {
  try {
    const idUsuario = req.user.sub;
    const limit  = parseInt(req.query.limit  ?? '20', 10);
    const offset = parseInt(req.query.offset ?? '0',  10);
    const result = await ppService.getTransactions(idUsuario, limit, offset);
    return res.status(200).json(result);
  } catch (err) {
    console.error('getTransactions', err);
    return res.status(500).json({ message: 'Error al obtener el historial' });
  }
}

// POST /api/purple-points/purchase  { itemId }
async function purchaseItem(req, res) {
  try {
    const idUsuario = req.user.sub;
    const { itemId } = req.body || {};
    if (!itemId || typeof itemId !== 'string') {
      return res.status(400).json({ message: 'itemId es requerido' });
    }

    const result = await ppService.purchaseItem(idUsuario, itemId);
    if (!result.ok) {
      if (result.status === 402) {
        return res.status(402).json({
          error:    'insufficient_balance',
          required: result.required,
          current:  result.current,
        });
      }
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(201).json({ ok: true, newBalance: result.newBalance, itemId: result.itemId });
  } catch (err) {
    console.error('purchaseItem', err);
    return res.status(500).json({ message: 'Error al procesar la compra' });
  }
}

// POST /api/purple-points/equip  { itemId, category }
// itemId puede ser null para desequipar
async function equipItem(req, res) {
  try {
    const idUsuario = req.user.sub;
    const body = req.body || {};
    const itemId   = body.itemId   ?? null;
    const category = body.category;

    if (!category) {
      return res.status(400).json({ message: 'category es requerido' });
    }

    const result = await ppService.equipItem(idUsuario, itemId, category);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ ok: true, equipped: result.equipped });
  } catch (err) {
    console.error('equipItem', err);
    return res.status(500).json({ message: 'Error al equipar el ítem' });
  }
}

// POST /api/purple-points/admin/adjust  { idUsuario, monto, descripcion }
async function adminAdjust(req, res) {
  try {
    const body = req.body || {};
    const idUsuario  = parsePgIntId(body.idUsuario);
    const monto      = parseInt(body.monto, 10);
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : null;

    if (!isValidPgInt32(idUsuario)) {
      return res.status(400).json({ message: 'idUsuario inválido' });
    }
    if (!Number.isInteger(monto) || monto === 0) {
      return res.status(400).json({ message: 'monto debe ser un entero distinto de cero' });
    }

    const result = await ppService.adminAdjust(idUsuario, monto, descripcion);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ ok: true, newBalance: result.newBalance });
  } catch (err) {
    console.error('adminAdjust', err);
    return res.status(500).json({ message: 'Error al ajustar el saldo' });
  }
}

module.exports = { getBalance, getTransactions, purchaseItem, equipItem, adminAdjust };
