import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerAndLogin } from './helpers/authHelper.js';
import { createCar, getAvailableCars } from './helpers/carHelper.js';
import { createRental, getUserRentals } from './helpers/rentalHelper.js';
import {
  HTTP_STATUS,
  PERFORMANCE_THRESHOLDS,
  STAGES_CONFIG,
  SLEEP_TIME
} from './config/constants.js';

// Métrica customizada para monitorar o tempo de resposta do POST /rentals
const createRentalDuration = new Trend('create_rental_duration');
const getUserRentalsDuration = new Trend('get_user_rentals_duration');

export const options = {
  // STAGES: Simula carga progressiva (ramp-up, plateau, ramp-down)
  stages: STAGES_CONFIG.LIGHT,
  thresholds: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.VERY_SLOW}`],
    'create_rental_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`],
    'get_user_rentals_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.NORMAL}`],
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
      'autenticação bem-sucedida': (r) => r.status === HTTP_STATUS.OK,
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
      'carro criado com sucesso': (r) => r.status === HTTP_STATUS.CREATED,
      'resposta contém dados do carro': (r) => {
        if (r.status === HTTP_STATUS.CREATED) {
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
      'rental criado com sucesso': (r) => r.status === HTTP_STATUS.CREATED,
      'resposta contém dados do rental': (r) => {
        if (r.status === HTTP_STATUS.CREATED) {
          const body = JSON.parse(r.body);
          return body.rental !== undefined && body.rental.id !== undefined;
        }
        return false;
      },
      'rental possui carId correto': (r) => {
        if (r.status === HTTP_STATUS.CREATED) {
          const body = JSON.parse(r.body);
          return body.rental.carId === carId;
        }
        return false;
      }
    });
  });

  // Pequena pausa para simular comportamento real de usuário
  sleep(SLEEP_TIME.THINK_TIME);

  group('Consulta: Listar Meus Aluguéis', function () {
    const rentalsResult = getUserRentals(authToken);
    
    // Adiciona tempo de resposta à métrica customizada
    getUserRentalsDuration.add(rentalsResult.response.timings.duration);
    
    check(rentalsResult.response, {
      'listagem de rentals bem-sucedida': (r) => r.status === HTTP_STATUS.OK,
      'resposta é um array': (r) => {
        if (r.status === HTTP_STATUS.OK) {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        }
        return false;
      },
      'usuário possui pelo menos 1 rental': (r) => {
        if (r.status === HTTP_STATUS.OK) {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        }
        return false;
      }
    });
  });

  // Pequena pausa final
  sleep(SLEEP_TIME.SHORT_PAUSE);
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

// Função para gerar relatório HTML automaticamente após a execução
export function handleSummary(data) {
  return {
    "test/k6/reports/rental-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}