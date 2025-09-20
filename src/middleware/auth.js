const jwt = require('jsonwebtoken');
const userRepository = require('../repository/userRepository');
const messages = require('../config/messages');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: messages.AUTHENTICATION_REQUIRED });
  }
};

module.exports = auth;