const request = require('supertest');
const createApplication = require('../../src/app');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const DEFAULT_PASSWORD = 'password123';
const EMAIL_DOMAIN = 'example.com';

// Funções auxiliares para geração de dados de teste
/**
 * Gera dados de usuário de teste aleatórios.
 * @returns {{name: string, email: string, cpf: string, password: string}}
 */
function generateRandomTestUserData() {
  const uniqueId = Date.now();
  return {
    name: `Test User ${uniqueId}`,
    email: `testuser-${uniqueId}@${EMAIL_DOMAIN}`,
    cpf: `000.000.000-${uniqueId.toString().slice(-2)}`,
    password: DEFAULT_PASSWORD,
  };
}

/**
 * Constrói dados de usuário de teste, permitindo sobrescrever valores padrão.
 * @param {object} [overrides={}] - Objeto com propriedades para sobrescrever os dados gerados.
 * @returns {{name: string, email: string, cpf: string, password: string}}
 */
function buildTestUserData(overrides = {}) {
  const randomData = generateRandomTestUserData();
  return {
    ...randomData,
    ...overrides,
  };
}

// Classes de Erro Customizadas
class RegistrationError extends Error {
  constructor(message, statusCode, responseBody) {
    super(message);
    this.name = 'RegistrationError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

class LoginError extends Error {
  constructor(message, statusCode, responseBody) {
    super(message);
    this.name = 'LoginError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

class TokenError extends Error {
  constructor(message, statusCode, responseBody) {
    super(message);
    this.name = 'TokenError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Realiza uma requisição de registro de usuário.
 * @param {object} app - Instância da aplicação Express.
 * @param {string} name - Nome do usuário.
 * @param {string} email - Email do usuário.
 * @param {string} cpf - CPF do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object>} - Resposta da requisição de registro.
 */
async function registerUserTest(app, name, email, cpf, password) {
  const res = await request(app)
    .post('/api/users/register')
    .send({ name, email, cpf, password });
  return res;
}

/**
 * Realiza uma requisição de login de usuário.
 * @param {object} app - Instância da aplicação Express.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object>} - Resposta da requisição de login.
 */
async function loginUserTest(app, email, password) {
  const res = await request(app)
    .post('/api/users/login')
    .send({ email, password });
  return res;
}

/**
 * Cria um usuário de teste e retorna uma sessão autenticada.
 * @param {object} app - Instância da aplicação Express.
 * @param {object} [options] - Dados opcionais para sobrescrever (name, email, cpf, password).
 * @returns {Promise<{ authToken: string, userId: string, userEmail: string, userName: string, userCpf: string }>}
 */
async function createTestUserSession(app, options = {}) {
  const userData = buildTestUserData(options);

  const userRes = await registerUserTest(app, userData.name, userData.email, userData.cpf, userData.password);
  
  if (userRes.statusCode !== 201) {
    throw new RegistrationError(`Failed to register user: ${userRes.body.error || userRes.text}`, userRes.statusCode, userRes.body);
  }

  const loginRes = await loginUserTest(app, userData.email, userData.password);

  if (loginRes.statusCode !== 200) {
    throw new LoginError(`Failed to login user: ${loginRes.body.error || loginRes.text}`, loginRes.statusCode, loginRes.body);
  }

  const decodedToken = jwt.decode(loginRes.body.token);
  if (!decodedToken || typeof decodedToken.id === 'undefined') {
    throw new TokenError('User ID not found or invalid in token after login.', null, null);
  }
  const userId = decodedToken.id;

  return {
    authToken: loginRes.body.token,
    userId: userId,
    userEmail: userData.email,
    userName: userData.name,
    userCpf: userData.cpf,
  };
}

/**
 * Registra um novo usuário de teste.
 * @param {object} app - Instância da aplicação Express.
 * @param {object} [options] - Dados opcionais para sobrescrever (name, email, cpf, password).
 * @returns {Promise<object>} - Resposta da requisição de registro.
 */
async function registerNewUserTest(app, options = {}) {
  const userData = buildTestUserData({
    name: options.name || 'New Test User',
    email: options.email,
    cpf: options.cpf,
    password: options.password,
  });

  const res = await registerUserTest(app, userData.name, userData.email, userData.cpf, userData.password);
  return res;
}

module.exports = {
  createTestUserSession,
  registerUserTest,
  loginUserTest,
  registerNewUserTest,
  RegistrationError,
  LoginError,
  TokenError,
  generateRandomTestUserData,
  buildTestUserData,
};