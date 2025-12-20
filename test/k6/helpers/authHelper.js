import http from 'k6/http';
import { sleep } from 'k6';
import { getBaseUrl } from './baseUrl.js';
import { generateUserData } from '../../shared/dataGenerator.js';

/**
 * @typedef {{email: string, password: string, response: Object}} RegistrationResult
 * @typedef {{token: string|null, response: Object|null}} LoginResult
 * @typedef {{token: string|null, email: string, password: string, response: Object|null}} AuthResult
 */

/**
 * Registra um novo usuário
 * @returns {RegistrationResult}
 */
export function registerUser() {
  const baseUrl = getBaseUrl();
  const userData = generateUserData();

  const response = http.post(
    `${baseUrl}/api/users/register`,
    JSON.stringify(userData),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return {
    email: userData.email,
    password: userData.password,
    response: response
  };
}

/**
 * Faz login com as credenciais fornecidas
 * @param {string} email
 * @param {string} password
 * @returns {LoginResult}
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
 * Faz login com retry logic para evitar race conditions
 * @param {string} email
 * @param {string} password
 * @param {number} maxAttempts
 * @param {number} delayMs
 * @returns {LoginResult}
 */
export function loginWithRetry(email, password, maxAttempts = 3, delayMs = 200) {
  const baseUrl = getBaseUrl();
  const loginData = { email, password };

  for (let i = 0; i < maxAttempts; i++) {
    const response = http.post(
      `${baseUrl}/api/users/login`,
      JSON.stringify(loginData),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.status === 200) {
      const body = JSON.parse(response.body);
      return {
        token: body.token,
        response: response
      };
    }

    // Se não é a última tentativa, aguarda antes de tentar novamente
    if (i < maxAttempts - 1) {
      sleep(delayMs / 1000);
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.error(`Login failed after ${maxAttempts} attempts for email: ${email}`);
  return {
    token: null,
    response: null
  };
}

/**
 * Registra um usuário e faz login automaticamente com retry logic
 * @returns {AuthResult}
 */
export function registerAndLogin() {
  const { email, password, response: registerResponse } = registerUser();
  
  // Usa retry logic ao invés de sleep fixo para evitar race conditions
  const { token, response } = loginWithRetry(email, password);

  return {
    token: token,
    email: email,
    password: password,
    response: response
  };
}