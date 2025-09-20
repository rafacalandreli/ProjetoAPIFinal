require('dotenv').config();
const request = require('supertest');
const { createApplication, startHttpServer } = require('../../src/app');
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
    cpf: generateValidCpf(),
    password: DEFAULT_PASSWORD,
  };
}

/**
 * Gera um CPF válido aleatoriamente.
 * @returns {string} Um CPF válido no formato "XXX.XXX.XXX-XX".
 */
function generateValidCpf() {
  const generateRandomDigits = (count) => {
    let digits = '';
    for (let i = 0; i < count; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  };

  const calculateVerifierDigit = (cpfBase) => {
    let sum = 0;
    let multiplier = cpfBase.length + 1;
    for (let i = 0; i < cpfBase.length; i++) {
      sum += parseInt(cpfBase[i]) * multiplier;
      multiplier--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  let cpfNineDigits = generateRandomDigits(9);

  let firstVerifier = calculateVerifierDigit(cpfNineDigits);
  let cpfTenDigits = cpfNineDigits + firstVerifier;

  let secondVerifier = calculateVerifierDigit(cpfTenDigits);
  let cpfElevenDigits = cpfTenDigits + secondVerifier;

  return cpfElevenDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
 * @param {object} server - Instância do servidor HTTP.
 * @param {string} name - Nome do usuário.
 * @param {string} email - Email do usuário.
 * @param {string} cpf - CPF do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object>} - Resposta da requisição de registro.
 */
async function registerUserTest(server, name, email, cpf, password) {
  const res = await request(server)
    .post('/api/users/register')
    .send({ name, email, cpf, password });
  return res;
}

/**
 * Realiza uma requisição de login de usuário.
 * @param {object} server - Instância do servidor HTTP.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object>} - Resposta da requisição de login.
 */
async function loginUserTest(server, email, password) {
  const res = await request(server)
    .post('/api/users/login')
    .send({ email, password });
  return res;
}

/**
 * Cria um usuário de teste e retorna uma sessão autenticada.
 * @param {object} [options] - Dados opcionais para sobrescrever (name, email, cpf, password).
 * @returns {Promise<{ authToken: string, userId: string, userEmail: string, userName: string, userCpf: string }>}
 */
async function createTestUserSession(baseUrl, options = {}) { // Adicionar baseUrl como parâmetro
  const userData = buildTestUserData(options);

  const userRes = await request(baseUrl) // Usar baseUrl
    .post('/api/users/register')
    .send({ name: userData.name, email: userData.email, cpf: userData.cpf, password: userData.password });
  
  if (userRes.statusCode !== 201) {
    throw new RegistrationError(`Failed to register user: ${userRes.body.error || userRes.text}`, userRes.statusCode, userRes.body);
  }

  const loginRes = await request(baseUrl) // Usar baseUrl
    .post('/api/users/login')
    .send({ email: userData.email, password: userData.password });

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
 * @param {string} baseUrl - A URL base da API.
 * @param {object} [options] - Dados opcionais para sobrescrever (name, email, cpf, password).
 * @returns {Promise<object>} - Resposta da requisição de registro.
 */
async function registerNewUserTest(baseUrl, options = {}) { // Adicionar baseUrl como parâmetro
  const userData = buildTestUserData({
    name: options.name || 'New Test User',
    email: options.email,
    cpf: options.cpf,
    password: options.password,
  });

  const res = await request(baseUrl) // Usar baseUrl
    .post('/api/users/register')
    .send({ name: userData.name, email: userData.email, cpf: userData.cpf, password: userData.password });
  return res;
}

module.exports = {
  createTestUserSession,
  registerUserTest: (baseUrl, name, email, cpf, password) => request(baseUrl).post('/api/users/register').send({ name, email, cpf, password }), // Adaptar para usar baseUrl
  loginUserTest: (baseUrl, email, password) => request(baseUrl).post('/api/users/login').send({ email, password }), // Adaptar para usar baseUrl
  registerNewUserTest,
  RegistrationError,
  LoginError,
  TokenError,
  generateRandomTestUserData,
  buildTestUserData,
};