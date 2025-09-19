const rentalRepository = require('../repository/rentalRepository');
const userRepository = require('../repository/userRepository');
const carRepository = require('../repository/carRepository');
const uuidv4 = require('uuid').v4;

class RentalService {
  async createRental(userId, carId, startDate, expectedEndDate) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error(messages.USER_NOT_FOUND);
    }

    const car = await carRepository.findById(carId);
    if (!car) {
      throw new Error(messages.CAR_NOT_FOUND);
    }

    // Regra: usuário só pode ter 2 aluguéis ativos
    const activeUserRentals = await rentalRepository.findActiveRentalsByUser(userId);
    if (activeUserRentals.length >= 2) {
      throw new Error(messages.USER_HAS_TWO_ACTIVE_RENTALS);
    }

    // Regra: carro não pode estar em outro aluguel ativo
    const activeCarRental = await rentalRepository.findActiveRentalByCar(carId);
    if (activeCarRental) {
      throw new Error(messages.CAR_ALREADY_RENTED);
    }

    // Disponibilidade
    if (!car.isAvailable) {
      throw new Error(messages.CAR_NOT_AVAILABLE);
    }

    const newRental = {
      id: uuidv4(),
      userId,
      carId,
      startDate: new Date(startDate).getTime(),
      expectedEndDate: new Date(expectedEndDate).getTime(),
      actualEndDate: null,
    };

    await carRepository.updateAvailability(carId, false);
    return rentalRepository.create(newRental);
  }

  async getRentalsByUser(userId) {
    // Garante que sempre retorna os aluguéis do usuário
    return rentalRepository.findRentalsByUser(userId);
  }
}

module.exports = new RentalService();
