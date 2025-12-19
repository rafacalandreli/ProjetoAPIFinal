import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './baseUrl.js';

/**
 * Cadastra um novo carro
 * @param {string} token - Token JWT de autenticação
 * @returns {Object} Objeto contendo car e response
 */
export function createCar(token) {
  const baseUrl = getBaseUrl();
  
  // Gera placa única baseada em timestamp
  const timestamp = Date.now();
  const plate = `ABC${timestamp.toString().slice(-4)}`;
  
  const carData = {
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
    plate: plate,
    dailyRate: 150.00
  };

  const response = http.post(
    `${baseUrl}/api/cars`,
    JSON.stringify(carData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  check(response, {
    'carro criado com sucesso': (r) => r.status === 201
  });

  let car = null;
  if (response.status === 201) {
    const body = JSON.parse(response.body);
    car = body.car;
  }

  return {
    car: car,
    response: response
  };
}

/**
 * Lista carros disponíveis
 * @param {string} token - Token JWT de autenticação
 * @returns {Object} Objeto contendo cars e response
 */
export function getAvailableCars(token) {
  const baseUrl = getBaseUrl();

  const response = http.get(
    `${baseUrl}/api/cars/available`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  check(response, {
    'listagem de carros bem-sucedida': (r) => r.status === 200
  });

  let cars = [];
  if (response.status === 200) {
    cars = JSON.parse(response.body);
  }

  return {
    cars: cars,
    response: response
  };
}