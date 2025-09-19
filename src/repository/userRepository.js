let users = []; // Banco de dados em memória

class UserRepository {
  async findByEmail(email) {
    return users.find(user => user.email === email);
  }

  async findByCpf(cpf) {
    return users.find(user => user.cpf === cpf);
  }

  async findById(id) {
    return users.find(user => user.id === id);
  }

  async create(user) {
    users.push(user);
    return user;
  }

  async findAll() {
    return users.map(user => ({ id: user.id, name: user.name, email: user.email, cpf: user.cpf }));
  }
}

const userRepository = new UserRepository();
module.exports = userRepository;
module.exports.users = users; // Exportar a array para fins de teste