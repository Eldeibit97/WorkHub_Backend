const { fetchReservations } = require('../services/reservation.service');

const getReservations = async (req, res) => {
  try {
    const { userId, status } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const reservations = await fetchReservations(userId, status);

    res.json(reservations);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
};

module.exports = { getReservations };