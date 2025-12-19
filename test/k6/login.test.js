import { group, check } from 'k6';
import http from 'k6/http';
import { getBaseUrl } from './helpers/baseUrl.js';
import { registerUser, login } from './helpers/authHelper.js';

export const options = {
  vus: 12, // 12 usuários virtuais
  duration: '20s', // 20 segundos de duração
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // p95 deve ser menor que 2000ms (2 segundos)
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  let userEmail, userPassword;

  group('Registro de Usuário', function () {
    const registrationResult = registerUser();
    
    check(registrationResult.response, {
      'status do registro é 201': (r) => r.status === 201,
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
      'status do login é 200': (r) => r.status === 200,
      'resposta do login contém token': (r) => {
        const body = JSON.parse(r.body);
        return body.token !== undefined && body.token !== null;
      }
    });
  });
}