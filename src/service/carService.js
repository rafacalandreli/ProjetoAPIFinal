const carRepository = require('../repository/carRepository');
const uuidv4 = require('uuid').v4;

class CarService {
  async registerCar(brand, model, year, plate, dailyRate) {
    if (await carRepository.findByPlate(plate)) {
      throw new Error(messages.PLATE_ALREADY_REGISTERED);
    }

    const newCar = {
      id: uuidv4(),
      brand,
      model,
      year,
      plate,
      dailyRate,
      isAvailable: true,
    };
    return carRepository.create(newCar);
  }

  async getAvailableCars() {
    return carRepository.findAllAvailable();
  }

  async getCarById(id) {
    return carRepository.findById(id);
  }
}

module.exports = new CarService();