import http from 'k6/http';
import { getBaseUrl } from './baseUrl.js';
import { generateCarData } from '../../shared/dataGenerator.js';

/**
 * @typedef {{car: Object|null, response: Object}} CarResult
 * @typedef {{cars: Array, response: Object}} CarsListResult
 */

/**
 * Cadastra um novo carro
 * @param {string} token - Token JWT de autenticação
 * @param {Object} [overrides={}] - Dados opcionais para sobrescrever
 * @returns {CarResult}
 */
export function createCar(token, overrides = {}) {
  const baseUrl = getBaseUrl();
  
  // Usa a função compartilhada para gerar dados do carro
  const carData = generateCarData(overrides);

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
 * @returns {CarsListResult}
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

  let cars = [];
  if (response.status === 200) {
    cars = JSON.parse(response.body);
  }

  return {
    cars: cars,
    response: response
  };
}