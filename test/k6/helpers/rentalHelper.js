import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './baseUrl.js';

/**
 * Cria um novo aluguel (rental)
 * @param {string} token - Token JWT de autenticação
 * @param {string} carId - ID do carro a ser alugado
 * @returns {Object} Objeto contendo rental e response
 */
export function createRental(token, carId) {
  const baseUrl = getBaseUrl();
  
  // Calcula datas: hoje + 7 dias
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  
  const rentalData = {
    carId: carId,
    startDate: today.toISOString().split('T')[0],  // formato: YYYY-MM-DD
    expectedEndDate: endDate.toISOString().split('T')[0]
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

  check(response, {
    'rental criado com sucesso': (r) => r.status === 201
  });

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
 * @returns {Object} Objeto contendo rentals e response
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

  check(response, {
    'listagem de rentals bem-sucedida': (r) => r.status === 200
  });

  let rentals = [];
  if (response.status === 200) {
    rentals = JSON.parse(response.body);
  }

  return {
    rentals: rentals,
    response: response
  };
}