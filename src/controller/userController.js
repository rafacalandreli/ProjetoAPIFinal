const messages = require('../config/messages');
const userService = require('../service/userService');

class UserController {
  async register(req, res) {
    try {
      const { name, email, cpf, password } = req.body;
      const user = await userService.registerUser(name, email, cpf, password);
      res.status(201).json({ message: messages.USER_REGISTERED_SUCCESS, user: { id: user.id, name: user.name, email: user.email, cpf: user.cpf } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { token } = await userService.loginUser(email, password);
      res.status(200).json({ message: messages.LOGIN_SUCCESS, token });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: messages.USER_NOT_FOUND });
      }
      res.status(200).json({ id: user.id, name: user.name, email: user.email, cpf: user.cpf });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();