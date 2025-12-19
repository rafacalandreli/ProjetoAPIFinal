import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerAndLogin } from './helpers/authHelper.js';
import { createCar, getAvailableCars } from './helpers/carHelper.js';
import { createRental, getUserRentals } from './helpers/rentalHelper.js';

// Métrica customizada para monitorar o tempo de resposta do POST /rentals
const createRentalDuration = new Trend('create_rental_duration');
const getUserRentalsDuration = new Trend('get_user_rentals_duration');

export const options = {
  // STAGES: Simula carga progressiva (ramp-up, plateau, ramp-down)
  stages: [
    { duration: '10s', target: 5 },   // Ramp-up: 0 → 5 usuários em 10s
    { duration: '20s', target: 10 },  // Ramp-up: 5 → 10 usuários em 20s
    { duration: '30s', target: 10 },  // Plateau: mantém 10 usuários por 30s
    { duration: '15s', target: 3 },   // Ramp-down: 10 → 3 usuários em 15s
    { duration: '10s', target: 0 }    // Ramp-down: 3 → 0 usuários em 10s
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // p95 < 3s (mais tolerante pois há mais operações)
    'create_rental_duration': ['p(95)<2000'], // p95 para criar rental < 2s
    'get_user_rentals_duration': ['p(95)<1500'], // p95 para listar rentals < 1.5s
    'checks': ['rate>0.95'], // 95% dos checks devem passar
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  let authToken;
  let carId;

  group('Setup: Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
    
    check(authResult.response, {
      'autenticação bem-sucedida': (r) => r.status === 200,
      'token JWT recebido': () => authToken !== null && authToken !== undefined
    });

    if (!authToken) {
      console.error('Falha na autenticação, abortando VU');
      return; // Aborta este usuário virtual se a autenticação falhar
    }
  });

  group('Setup: Criação de Carro', function () {
    const carResult = createCar(authToken);
    
    check(carResult.response, {
      'carro criado com sucesso': (r) => r.status === 201,
      'resposta contém dados do carro': (r) => {
        if (r.status === 201) {
          const body = JSON.parse(r.body);
          return body.car !== undefined && body.car.id !== undefined;
        }
        return false;
      }
    });

    if (carResult.car && carResult.car.id) {
      carId = carResult.car.id;
    } else {
      console.error('Falha ao criar carro, abortando VU');
      return;
    }
  });

  group('Operação Principal: Criar Aluguel', function () {
    const rentalResult = createRental(authToken, carId);
    
    // Adiciona tempo de resposta à métrica customizada
    createRentalDuration.add(rentalResult.response.timings.duration);
    
    check(rentalResult.response, {
      'rental criado com sucesso': (r) => r.status === 201,
      'resposta contém dados do rental': (r) => {
        if (r.status === 201) {
          const body = JSON.parse(r.body);
          return body.rental !== undefined && body.rental.id !== undefined;
        }
        return false;
      },
      'rental possui carId correto': (r) => {
        if (r.status === 201) {
          const body = JSON.parse(r.body);
          return body.rental.carId === carId;
        }
        return false;
      }
    });
  });

  // Pequena pausa para simular comportamento real de usuário
  sleep(1);

  group('Consulta: Listar Meus Aluguéis', function () {
    const rentalsResult = getUserRentals(authToken);
    
    // Adiciona tempo de resposta à métrica customizada
    getUserRentalsDuration.add(rentalsResult.response.timings.duration);
    
    check(rentalsResult.response, {
      'listagem de rentals bem-sucedida': (r) => r.status === 200,
      'resposta é um array': (r) => {
        if (r.status === 200) {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        }
        return false;
      },
      'usuário possui pelo menos 1 rental': (r) => {
        if (r.status === 200) {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        }
        return false;
      }
    });
  });

  // Pequena pausa final
  sleep(0.5);
}

// Função executada uma vez no início do teste (antes dos stages)
export function setup() {
  console.log('🚀 Iniciando teste de Rental com STAGES');
  console.log('📊 Stages configurados:');
  console.log('  - Ramp-up: 0→5 usuários (10s)');
  console.log('  - Ramp-up: 5→10 usuários (20s)');
  console.log('  - Plateau: 10 usuários (30s)');
  console.log('  - Ramp-down: 10→3 usuários (15s)');
  console.log('  - Ramp-down: 3→0 usuários (10s)');
  console.log('⏱️  Duração total: 85 segundos');
}

// Função executada uma vez no final do teste (depois dos stages)
export function teardown(data) {
  console.log('✅ Teste de Rental com STAGES finalizado');
}