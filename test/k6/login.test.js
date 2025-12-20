import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerUser, loginWithRetry } from './helpers/authHelper.js';
import { HTTP_STATUS, PERFORMANCE_THRESHOLDS, LOAD_CONFIG, SLEEP_TIME } from './config/constants.js';

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
    
    const registroSucesso = check(registrationResult.response, {
      'status do registro é 201': (r) => r.status === HTTP_STATUS.CREATED,
      'resposta do registro contém user': (r) => {
        const body = JSON.parse(r.body);
        return body.user !== undefined;
      }
    });

    if (!registroSucesso) {
      console.error(`❌ FALHA NO REGISTRO`);
      console.error(`Status: ${registrationResult.response.status}`);
      console.error(`Body: ${registrationResult.response.body}`);
    } else {
      console.log(`✅ Usuário registrado: ${registrationResult.email}`);
    }

    userEmail = registrationResult.email;
    userPassword = registrationResult.password;
  });

  sleep(SLEEP_TIME.SHORT_PAUSE);

  group('Login de Usuário', function () {
    const loginResult = loginWithRetry(userEmail, userPassword);
    
    const loginSucesso = check(loginResult.response, {
      'status do login é 200': (r) => r && r.status === HTTP_STATUS.OK,
      'resposta do login contém token': (r) => {
        if (!r) return false;
        const body = JSON.parse(r.body);
        return body.token !== undefined && body.token !== null;
      }
    });
    
    if (!loginSucesso) {
      console.error(`❌ FALHA NO LOGIN`);
      console.error(`Email tentado: ${userEmail}`);
      console.error(`Senha tentada: ${userPassword}`);
      console.error(`Status: ${loginResult.response ? loginResult.response.status : 'N/A'}`);
      console.error(`Body: ${loginResult.response ? loginResult.response.body : 'Sem resposta'}`);
    } else {
      console.log(`✅ Login realizado com sucesso: ${userEmail}`);
      console.log(`🔑 Token recebido: ${loginResult.token ? 'Sim' : 'Não'}`);
    }
  });
}

// Função para gerar relatório HTML automaticamente após a execução
export function handleSummary(data) {
  return {
    "test/k6/reports/login-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}