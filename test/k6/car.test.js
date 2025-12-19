import { group, check } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerAndLogin } from './helpers/authHelper.js';

// Métrica customizada para monitorar o tempo de resposta do GET /cars/available
const getCarsAvailableDuration = new Trend('get_cars_available_duration');

export const options = {
  vus: 12, // 12 usuários virtuais
  duration: '20s', // 20 segundos de duração
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // p95 deve ser menor que 2000ms (2 segundos)
    'get_cars_available_duration': ['p(95)<2000'], // p95 da métrica customizada também < 2s
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  let authToken;

  group('Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
    
    check(authResult.response, {
      'autenticação bem-sucedida': (r) => r.status === 200,
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
      'status da listagem é 200': (r) => r.status === 200,
      'resposta é um array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch (e) {
          return false;
        }
      },
      'token de autorização foi aceito': (r) => r.status !== 401
    });
  });
}