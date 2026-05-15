const svc = require('../services/adminReservations.service');

async function listUserReservations(req, res) {
  try {
    const { status, from, to, page, pageSize } = req.query || {};
    const result = await svc.listUserReservations({
      id_usuario: req.params.id,
      status,
      from,
      to,
      page,
      pageSize,
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });
    return res.status(200).json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function cancelUserReservation(req, res) {
  try {
    const result = await svc.cancelUserReservation(
      req.params.reservationId,
      req.user.sub
    );
    if (!result.ok) return res.status(result.status).json({ message: result.message });
    return res.status(200).json({ message: 'Reserva cancelada correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = { listUserReservations, cancelUserReservation };