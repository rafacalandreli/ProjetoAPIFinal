import { group, check } from 'k6';
import http from 'k6/http';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerUser, login } from './helpers/authHelper.js';
import { HTTP_STATUS, PERFORMANCE_THRESHOLDS, LOAD_CONFIG } from './config/constants.js';

export const options = {
  ...LOAD_CONFIG.LIGHT, // Configuração de carga leve
  thresholds: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`],
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  let userEmail, userPassword;

  group('Registro de Usuário', function () {
    const registrationResult = registerUser();
    
    check(registrationResult.response, {
      'status do registro é 201': (r) => r.status === HTTP_STATUS.CREATED,
      'resposta do registro contém user': (r) => {
        const body = JSON.parse(r.body);
        return body.user !== undefined;
      }
    });

    userEmail = registrationResult.email;
    userPassword = registrationResult.password;
  });

  group('Login de Usuário', function () {
    const loginResult = login(userEmail, userPassword);
    
    check(loginResult.response, {
      'status do login é 200': (r) => r.status === HTTP_STATUS.OK,
      'resposta do login contém token': (r) => {
        const body = JSON.parse(r.body);
        return body.token !== undefined && body.token !== null;
      }
    });
  });
}

// Função para gerar relatório HTML automaticamente após a execução
export function handleSummary(data) {
  return {
    "test/k6/reports/login-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}