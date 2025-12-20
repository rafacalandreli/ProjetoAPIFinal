import http from 'k6/http';
import { getBaseUrl } from './baseUrl.js';

/**
 * @typedef {{rental: Object|null, response: Object}} RentalResult
 * @typedef {{rentals: Array, response: Object}} RentalsListResult
 */

/**
 * Cria um novo aluguel (rental)
 * @param {string} token - Token JWT de autenticação
 * @param {string} carId - ID do carro a ser alugado
 * @param {Object} [overrides={}] - Dados opcionais para sobrescrever (startDate, expectedEndDate)
 * @returns {RentalResult}
 */
export function createRental(token, carId, overrides = {}) {
  const baseUrl = getBaseUrl();
  
  // Calcula datas: hoje + 7 dias (padrão)
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  
  const rentalData = {
    carId: carId,
    startDate: overrides.startDate || today.toISOString().split('T')[0],
    expectedEndDate: overrides.expectedEndDate || endDate.toISOString().split('T')[0]
  };

  const response = http.post(
    `${baseUrl}/api/rentals`,
    JSON.stringify(rentalData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  let rental = null;
  if (response.status === 201) {
    const body = JSON.parse(response.body);
    rental = body.rental;
  }

  return {
    rental: rental,
    response: response
  };
}

/**
 * Lista todos os aluguéis do usuário autenticado
 * @param {string} token - Token JWT de autenticação
 * @returns {RentalsListResult}
 */
export function getUserRentals(token) {
  const baseUrl = getBaseUrl();

  const response = http.get(
    `${baseUrl}/api/rentals/user`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  let rentals = [];
  if (response.status === 200) {
    rentals = JSON.parse(response.body);
  }

  return {
    rentals: rentals,
    response: response
  };
}