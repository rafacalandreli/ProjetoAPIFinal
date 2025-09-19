let rentals = []; // Banco de dados em memória

class RentalRepository {
  async create(rental) {
    rentals.push(rental);
    console.log('Rentals after create:', JSON.stringify(rentals));
    return rental;
  }

  async findActiveRentalsByUser(userId) {
    return rentals.filter(rental =>
      rental.userId === userId && rental.actualEndDate === null
    );
  }

  async findActiveRentalByCar(carId) {
    return rentals.find(rental =>
      rental.carId === carId && rental.actualEndDate === null
    );
  }

  async findRentalsByUser(userId) {
    return rentals.filter(rental => rental.userId === userId);
  }

  async finishRental(rentalId, actualEndDate) {
    const rental = rentals.find(r => r.id === rentalId);
    if (rental) {
      rental.actualEndDate = new Date(actualEndDate).getTime();
      return rental;
    }
    return null;
  }
}

const rentalRepository = new RentalRepository();
module.exports = rentalRepository;
module.exports.rentals = rentals; // Exportar array para fins de teste
