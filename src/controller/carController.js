const carService = require('../service/carService');
const messages = require('../config/messages');

class CarController {
  async registerCar(req, res) {
    try {
      const { brand, model, year, plate, dailyRate } = req.body;
      const car = await carService.registerCar(brand, model, year, plate, dailyRate);
      res.status(201).json({ message: messages.CAR_REGISTERED_SUCCESS, car });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAvailableCars(req, res) {
    try {
      const cars = await carService.getAvailableCars();
      res.status(200).json(cars);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CarController();