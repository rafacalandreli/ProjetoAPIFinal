const userRepository = require('../repository/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

class UserService {
  async registerUser(name, email, cpf, password) {
    if (await userRepository.findByEmail(email)) {
      throw new Error('Email já cadastrado.');
    }
    if (await userRepository.findByCpf(cpf)) {
      throw new Error('CPF já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      cpf,
      password: hashedPassword,
    };
    return userRepository.create(newUser);
  }

  async loginUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error(messages.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error(messages.INVALID_CREDENTIALS);
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    return { token };
  }

  async getAllUsers() {
    return userRepository.findAll();
  }

  async getUserById(id) {
    return userRepository.findById(id);
  }
}

module.exports = new UserService();