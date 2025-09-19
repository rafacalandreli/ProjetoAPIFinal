let cars = []; // Banco de dados em memória

class CarRepository {
  async findByPlate(plate) {
    return cars.find(car => car.plate === plate);
  }

  async findById(id) {
    return cars.find(car => car.id === id);
  }

  async create(car) {
    cars.push(car);
    return car;
  }

  async findAllAvailable() {
    return cars.filter(car => car.isAvailable);
  }

  async updateAvailability(id, isAvailable) {
    const car = cars.find(c => c.id === id);
    if (car) {
      car.isAvailable = isAvailable;
      return car;
    }
    return null;
  }
}

const carRepository = new CarRepository();
module.exports = carRepository;
module.exports.cars = cars; // Exportar a array para fins de teste