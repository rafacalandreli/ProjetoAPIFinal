const rentalService = require('../service/rentalService');
const messages = require('../config/messages');

class RentalController {
  async createRental(req, res) {
    try {
      const { carId, startDate, expectedEndDate } = req.body;
      const userId = req.user.id; // Obtido do middleware de autenticação
      const rental = await rentalService.createRental(userId, carId, startDate, expectedEndDate);
      res.status(201).json({ message: messages.RENTAL_REGISTERED_SUCCESS, rental });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRentalsByUser(req, res) {
    try {
      const userId = req.user.id; // Obtido do middleware de autenticação
      const rentals = await rentalService.getRentalsByUser(userId);
      if (rentals.length === 0) {
        return res.status(404).json({ error: messages.RENTALS_NOT_FOUND });
      }
      res.status(200).json(rentals);
    } catch (error) {
      res.status(500).json({ error: error.message});
    }
  }
}

module.exports = new RentalController();