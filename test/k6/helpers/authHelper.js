import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './baseUrl.js';
import { 
  generateRandomName, 
  generateRandomPassword, 
  generateUniqueEmail, 
  generateUniqueCPF 
} from './dataGenerator.js';

/**
 * Registra um novo usuário e retorna suas credenciais
 * @returns {Object} Objeto contendo email, password e response
 */
export function registerUser() {
  const baseUrl = getBaseUrl();
  const userData = {
    name: generateRandomName(),
    email: generateUniqueEmail(),
    cpf: generateUniqueCPF(),
    password: generateRandomPassword()
  };

  const response = http.post(
    `${baseUrl}/api/users/register`,
    JSON.stringify(userData),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  check(response, {
    'registro foi bem-sucedido': (r) => r.status === 201
  });

  return {
    email: userData.email,
    password: userData.password,
    response: response
  };
}

/**
 * Faz login com as credenciais fornecidas
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Object} Objeto contendo token e response
 */
export function login(email, password) {
  const baseUrl = getBaseUrl();
  const loginData = {
    email: email,
    password: password
  };

  const response = http.post(
    `${baseUrl}/api/users/login`,
    JSON.stringify(loginData),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  check(response, {
    'login foi bem-sucedido': (r) => r.status === 200
  });

  let token = null;
  if (response.status === 200) {
    const body = JSON.parse(response.body);
    token = body.token;
  }

  return {
    token: token,
    response: response
  };
}

/**
 * Registra um usuário e faz login automaticamente
 * @returns {Object} Objeto contendo token, email, password e response
 */
export function registerAndLogin() {
  const { email, password } = registerUser();
  const { token, response } = login(email, password);

  return {
    token: token,
    email: email,
    password: password,
    response: response
  };
}