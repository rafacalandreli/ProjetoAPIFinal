import { group, check } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerAndLogin } from './helpers/authHelper.js';
import { HTTP_STATUS, PERFORMANCE_THRESHOLDS, LOAD_CONFIG } from './config/constants.js';

// Métrica customizada para monitorar o tempo de resposta do GET /cars/available
const getCarsAvailableDuration = new Trend('get_cars_available_duration');

export const options = {
  ...LOAD_CONFIG.MEDIUM, // Configuração de carga média
  thresholds: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`],
    'get_cars_available_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.FAST}`], // GET deve ser rápido
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  let authToken;

  group('Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
    
    check(authResult.response, {
      'autenticação bem-sucedida': (r) => r.status === HTTP_STATUS.OK,
      'token foi recebido': () => authToken !== null && authToken !== undefined
    });
  });

  group('Listagem de Automóveis Disponíveis', function () {
    const response = http.get(
      `${baseUrl}/api/cars/available`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Adiciona o tempo de resposta à métrica customizada
    getCarsAvailableDuration.add(response.timings.duration);

    check(response, {
      'status da listagem é 200': (r) => r.status === HTTP_STATUS.OK,
      'resposta é um array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch (e) {
          return false;
        }
      },
      'token de autorização foi aceito': (r) => r.status !== HTTP_STATUS.UNAUTHORIZED
    });
  });
}

// Função para gerar relatório HTML automaticamente após a execução
export function handleSummary(data) {
  return {
    "test/k6/reports/car-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}