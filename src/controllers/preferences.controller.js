const {fetchAvailability, fetchReservationHistory, fetchInferredPreferences} = require('../services/preferences.service');

const getReservationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId parameter is required' });
        }

        const history = await fetchReservationHistory(userId);

        res.json(history);

    }
    catch (error){
        console.error("Error fetching reservation history:", error);
        res.status(500).json({'message': 'Error fetching reservation history'});
    }
};

const getInferredPreferences = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'userId parameter is required' });
        }

        const preferences = await fetchInferredPreferences(userId);

        res.json(preferences);

    }
    catch (error){
        console.error("Error fetching inferred preferences:", error);
        res.status(500).json({'message': 'Error fetching inferred preferences'});
    }
};

module.exports = { getReservationHistory, getInferredPreferences };