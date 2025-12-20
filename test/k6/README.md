# 📊 Testes de Performance K6 - API Locadora de Veículos
Testes de Performance realizados na API Locadora de Veículos como parte do Trabalho de Conclusão da Disciplina de Automação de Testes de Performance.

##  Estrutura do Projeto

Busquei estruturar o projeto de uma forma que fosse fácil de manter e de reutilizar estruturas comuns a outros tipos de testes. (Temos testes usando o super-test que compartilham um dataGenerator com o K6 'shared/dataGenerator.js').

```
test/k6/
├── config/
│   └── constants.js       # Constantes centralizadas (HTTP status, thresholds, etc)
├── helpers/
│   ├── authHelper.js      # Funções de autenticação (register, login, loginWithRetry)
│   ├── baseUrl.js         # Gerenciamento de URL base
│   ├── dataGenerator.js   # Wrapper que importa do módulo compartilhado
│   ├── carHelper.js       # Funções de gerenciamento de carros
│   └── rentalHelper.js    # Funções de gerenciamento de aluguéis
├── reports/
│   └── README.md          # Documentação dos relatórios HTML
├── login.test.js          # Teste de registro e login
├── car.test.js            # Teste de listagem de carros
├── rental.test.js         # Teste de aluguéis com Stages
└── README.md              # Este arquivo
```

---

##  Conceitos Aplicados nestes testes

### 1.  Thresholds

**O que é:** Thresholds define os critérios de sucesso/falha baseados em métricas. Se não forem atingidos, o teste deve falhar.

**Onde aplicado:**
- [`login.test.js:9-14`](login.test.js#L9-L14)
- [`car.test.js:13-19`](car.test.js#L13-L19)
- [`rental.test.js:21-30`](rental.test.js#L21-L30)

**Código:**
```javascript
// Exemplo do login.test.js
import { HTTP_STATUS, PERFORMANCE_THRESHOLDS, LOAD_CONFIG } from './config/constants.js';

export const options = {
  ...LOAD_CONFIG.LIGHT, // vus: 10, duration: '1m'
  thresholds: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`], // p95 < 2000ms
  },
};

// Exemplo do car.test.js
export const options = {
  ...LOAD_CONFIG.MEDIUM, // vus: 50, duration: '3m'
  thresholds: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`],
    'get_cars_available_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.FAST}`],
  },
};
```

**Explicação:** Se 95% das requisições demorarem mais de 2 segundos, o teste deve ser considerado como FALHO. Isso garante que a API mantenha performance aceitável mesmo sob carga.

---

### 2.  Checks

**O que é:** São as validações que verificam se a resposta retornada pela API está correta, mas não interrompem a execução do teste.

**Onde aplicado:**
- [`login.test.js:23-29`](login.test.js#L23-L29)
- [`login.test.js:48-55`](login.test.js#L48-L55)
- [`car.test.js:29-32`](car.test.js#L29-L32)
- [`car.test.js:49-60`](car.test.js#L49-L60)
- [`rental.test.js:41-44`](rental.test.js#L41-L44)
- [`rental.test.js:80-96`](rental.test.js#L80-L96)

**Código:**
```javascript
// Em login.test.js - usando constantes
import { HTTP_STATUS } from './config/constants.js';

check(registrationResult.response, {
  'status do registro é 201': (r) => r.status === HTTP_STATUS.CREATED,
  'resposta do registro contém user': (r) => {
    const body = JSON.parse(r.body);
    return body.user !== undefined;
  }
});

// Em car.test.js - com tratamento de erro
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
```

**Explicação:** Cada check usado nos testes registrou se os mesmos passaram ou falharam no relatório final. Diferente de assertions, checks não param o teste se falharem, permitindo coletar mais dados sobre o comportamento sob carga.

---

### 3.  Helpers

**O que é:** Encapsulam a lógica de negócio (ex: authHelper.js gerencia o fluxo de token e retry logic). São usadas para organizar o código e tornar os testes mais faceis de manter e evoluir.

**Onde aplicado:**
- [`helpers/authHelper.js`](helpers/authHelper.js) - `registerUser()`, `login()`, `loginWithRetry()`, `registerAndLogin()`
- [`helpers/baseUrl.js`](helpers/baseUrl.js) - `getBaseUrl()`
- [`helpers/dataGenerator.js`](helpers/dataGenerator.js) - wrapper que re-exporta de [`test/shared/dataGenerator.js`](../shared/dataGenerator.js)
- [`helpers/carHelper.js`](helpers/carHelper.js) - `createCar()`, `getAvailableCars()`
- [`helpers/rentalHelper.js`](helpers/rentalHelper.js) - `createRental()`, `getUserRentals()`
- [`config/constants.js`](config/constants.js) - constantes centralizadas

**Código:**
```javascript
// helpers/authHelper.js
import { generateUserData } from '../../shared/dataGenerator.js';

export function registerUser() {
  const baseUrl = getBaseUrl();
  const userData = generateUserData();  // ← Gera dados completos
  
  const response = http.post(
    `${baseUrl}/api/users/register`,
    JSON.stringify(userData),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  return {
    email: userData.email,
    password: userData.password,
    response
  };
}

export function loginWithRetry(email, password, maxAttempts = 3, delayMs = 200) {
  // ... retry logic para evitar race conditions
  for (let i = 0; i < maxAttempts; i++) {
    const response = http.post(`${baseUrl}/api/users/login`, ...);
    if (response.status === 200) {
      return { token: body.token, response };
    }
    if (i < maxAttempts - 1) sleep(delayMs / 1000);
  }
  return { token: null, response: null };
}

export function registerAndLogin() {
  const { email, password } = registerUser();
  const { token, response } = loginWithRetry(email, password);  // ← Usa retry
  return { token, email, password, response };
}
```

**Uso nos testes:**
```javascript
// login.test.js
import { registerUser, loginWithRetry } from './helpers/authHelper.js';
import { HTTP_STATUS } from './config/constants.js';

const registrationResult = registerUser();
const loginResult = loginWithRetry(userEmail, userPassword);

check(loginResult.response, {
  'status do login é 200': (r) => r && r.status === HTTP_STATUS.OK
});

// car.test.js
import { registerAndLogin } from './helpers/authHelper.js';

const authResult = registerAndLogin();
```

**Explicação:** Helpers eliminam duplicação de código. 

---

### 4. Trends

**O que é:** Nada mais é que uma métrica customizada do K6 para rastrear os valores numéricos ao longo do tempo (ex: tempo de resposta).

**Onde aplicado:**
- [`car.test.js:11`](car.test.js#L11) - definição
- [`car.test.js:47`](car.test.js#L47) - uso
- [`rental.test.js:18-19`](rental.test.js#L18-L19) - duas trends

**Código:**
```javascript
// car.test.js
import { Trend } from 'k6/metrics';

// Criando a métrica customizada
const getCarsAvailableDuration = new Trend('get_cars_available_duration');

export default function () {
  const baseUrl = getBaseUrl();
  let authToken;
  
  group('Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
  });
  
  group('Listagem de Automóveis Disponíveis', function () {
    const response = http.get(`${baseUrl}/api/cars/available`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Registrando o valor na métrica customizada
    getCarsAvailableDuration.add(response.timings.duration);  // ← TREND
    
    check(response, { /* ... checks ... */ });
  });
}

// rental.test.js - Exemplo com múltiplas Trends
const createRentalDuration = new Trend('create_rental_duration');
const getUserRentalsDuration = new Trend('get_user_rentals_duration');

group('Operação Principal: Criar Aluguel', function () {
  const rentalResult = createRental(authToken, carId);
  createRentalDuration.add(rentalResult.response.timings.duration);
});

group('Consulta: Listar Meus Aluguéis', function () {
  const rentalsResult = getUserRentals(authToken);
  getUserRentalsDuration.add(rentalsResult.response.timings.duration);
});
```

---

### 5.  Faker

**O que é:** É uma das bibliotecas mais usadas para gerar dados realistas e aleatórios (nomes, emails, senhas, etc).

**Onde aplicado:**
- [`test/shared/dataGenerator.js`](../shared/dataGenerator.js) - módulo principal compartilhado
- [`helpers/dataGenerator.js`](helpers/dataGenerator.js) - wrapper K6 que re-exporta

**Código do módulo compartilhado:**
```javascript
// test/shared/dataGenerator.js
// ✅ Compatível com Node.js (Supertest) e K6 (sem dependências externas)

export function generateValidCPF() {
  // ... algoritmo de geração de CPF válido com dígitos verificadores
  return cpfElevenDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function generateUniqueEmail(domain = 'test.com') {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `user_${timestamp}_${randomNum}@${domain}`;
}

export function generateRandomName() {
  const timestamp = Date.now();
  return `Test User ${timestamp}`;
}

export function generateTestPassword() {
  return 'Test@123456';
}

export function generateUserData(overrides = {}) {
  return {
    name: generateRandomName(),
    email: generateUniqueEmail(),
    cpf: generateValidCPF(),
    password: generateTestPassword(),
    ...overrides
  };
}

export function generateCarData(overrides = {}) {
  return {
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
    plate: generateCarPlate(),
    dailyRate: 150.00,
    ...overrides
  };
}
```

**Wrapper K6 (opcional - adiciona Faker):**
```javascript
// test/k6/helpers/dataGenerator.js
// Re-exporta tudo do módulo compartilhado
export {
  generateValidCPF,
  generateUniqueEmail,
  generateRandomName,
  generateTestPassword,
  generateCarPlate,
  generateUserData,
  generateCarData
} from '../../shared/dataGenerator.js';

// Funções adicionais com Faker (opcional)
import faker from 'k6/x/faker';

export function generateRandomNameWithFaker() {
  return faker.person.name();
}

export function generateRandomPasswordWithFaker() {
  return faker.internet.password();
}
```

**Uso nos testes:**
```javascript
// helpers/authHelper.js
import { generateUserData } from '../../shared/dataGenerator.js';

export function registerUser() {
  const userData = generateUserData();  // Gera tudo de uma vez
  // userData = { name, email, cpf, password }
  // ...
}

// helpers/carHelper.js
import { generateCarData } from '../../shared/dataGenerator.js';

export function createCar(authToken) {
  const carData = generateCarData();  // Gera dados de carro
  // carData = { brand, model, year, plate, dailyRate }
  // ...
}
```

**Explicação:** O módulo compartilhado garante consistência entre testes Supertest (Node.js) e K6. Cada VU cria dados únicos baseados em timestamp, evitando conflitos de duplicação.

---

### 6.  Variável de Ambiente

**O que é:** Permite configurar valores externamente via linha de comando, sem modificar o código.

**Onde aplicado:** [`helpers/baseUrl.js:5-7`](helpers/baseUrl.js#L5-L7)

**Benefícios da centralização:**
- Um único ponto de configuração
- Facilita mudanças de ambiente
- Evita hardcoding de URLs nos testes

**Código:**
```javascript
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';  // ← VARIÁVEL DE AMBIENTE
}
```

**Uso:**
```javascript
// Todos os testes usam:
import { getBaseUrl } from './helpers/baseUrl.js';

const baseUrl = getBaseUrl();  // ← Pega da env ou usa padrão
const response = http.post(`${baseUrl}/api/users/register`, ...);
```

**Como executar:**
```bash
# Ambiente local (padrão)
k6 run test/k6/login.test.js

# Ambiente de staging
k6 run -e BASE_URL=https://staging-api.exemplo.com test/k6/login.test.js

# Ambiente de produção
k6 run -e BASE_URL=https://api.exemplo.com test/k6/login.test.js
```

**Explicação:** Um único teste pode rodar em múltiplos ambientes apenas mudando a variável `-e BASE_URL`, sem necessidade de múltiplos arquivos ou modificações no código.

---

### 7.  Reaproveitamento de Resposta

**O que é:** Usar dados de uma requisição anterior em requisições subsequentes.

**Onde aplicado:**
- [`login.test.js:18-41`](login.test.js#L18-L41) - captura email/password do registro
- [`login.test.js:45-67`](login.test.js#L45-L67) - reusa para login
- [`car.test.js:23-33`](car.test.js#L23-L33) - captura token
- [`car.test.js:35-61`](car.test.js#L35-L61) - reusa token em GET
- [`rental.test.js:34-50`](rental.test.js#L34-L50) - captura token
- [`rental.test.js:52-72`](rental.test.js#L52-L72) - captura carId
- [`rental.test.js:74-97`](rental.test.js#L74-L97) - reusa ambos

**Código:**
```javascript
// login.test.js
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

    userEmail = registrationResult.email;      // ← CAPTURA
    userPassword = registrationResult.password; // ← CAPTURA
  });

  sleep(SLEEP_TIME.SHORT_PAUSE);

  group('Login de Usuário', function () {
    const loginResult = loginWithRetry(userEmail, userPassword);  // ← REUSO com retry
    
    check(loginResult.response, {
      'status do login é 200': (r) => r && r.status === HTTP_STATUS.OK,
      'resposta do login contém token': (r) => {
        if (!r) return false;
        const body = JSON.parse(r.body);
        return body.token !== undefined && body.token !== null;
      }
    });
  });
}

// rental.test.js - Exemplo mais complexo
export default function () {
  const baseUrl = getBaseUrl();
  let authToken;  // ← CAPTURA 1
  let carId;      // ← CAPTURA 2

  group('Setup: Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
  });

  group('Setup: Criação de Carro', function () {
    const carResult = createCar(authToken);  // ← USA CAPTURA 1
    carId = carResult.car.id;  // ← CAPTURA 2
  });

  group('Operação Principal: Criar Aluguel', function () {
    const rentalResult = createRental(authToken, carId);  // ← USA AMBOS
  });

  sleep(SLEEP_TIME.THINK_TIME);

  group('Consulta: Listar Meus Aluguéis', function () {
    const rentalsResult = getUserRentals(authToken);  // ← USA CAPTURA 1
  });
}
```

**Explicação:** Uma boa forma de reaproveitamente de resposta, é quando simulamos o fluxo real de usuário: registrar-se na aplicação → fazer login na mesma → usar um token em requisições autenticadas. Evita criar dados desnecessários e testa a integração entre endpoints.

---

### 8. Uso de Token de Autenticação

**O que é:** Implementação de autenticação JWT Bearer Token para acessar endpoints protegidos.

**Onde aplicado:** [`car.test.js:24-42`](car.test.js#L24-L42)

**Código:**
```javascript
group('Autenticação', function () {
  const authResult = registerAndLogin();
  authToken = authResult.token;  // ← EXTRAI o token JWT da resposta
  
  check(authResult.response, {
    'autenticação bem-sucedida': (r) => r.status === 200,
    'token foi recebido': () => authToken !== null  // ← VALIDA que recebeu
  });
});

group('Listagem de Automóveis Disponíveis', function () {
  const response = http.get(`${baseUrl}/api/cars/available`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,  // ← USA o token no header
      'Content-Type': 'application/json'
    }
  });

  check(response, {
    'token de autorização foi aceito': (r) => r.status !== 401  // ← VALIDA autorização
  });
});
```

**Helper que extrai o token:**
```javascript
// helpers/authHelper.js
export function login(email, password) {
  const response = http.post(`${baseUrl}/api/users/login`, ...);
  
  let token = null;
  if (response.status === 200) {
    const body = JSON.parse(response.body);
    token = body.token;  // ← EXTRAI do JSON
  }
  
  return { token, response };
}
```

**Explicação:** Implementa o fluxo completo de autenticação JWT: obter token no login → armazenar → enviar em cada requisição protegida via header `Authorization: Bearer <token>`. Isso testa a segurança da API, garantindo que endpoints protegidos só aceitam tokens válidos.

---

### 9. Groups

**O que é:** Organiza os testes em blocos lógicos, permitindo métricas agregadas por funcionalidade.

**Onde aplicado:**
- [`login.test.js:17-33`](login.test.js#L17-L33)
- [`car.test.js:22-60`](car.test.js#L22-L60)

**Código:**
```javascript
// login.test.js
export default function () {
  group('Registro de Usuário', function () {  // ← GROUP 1
    const registrationResult = registerUser();
    check(registrationResult.response, { ... });
  });

  group('Login de Usuário', function () {  // ← GROUP 2
    const loginResult = login(userEmail, userPassword);
    check(loginResult.response, { ... });
  });
}

// car.test.js
export default function () {
  group('Autenticação', function () {  // ← GROUP 1
    const authResult = registerAndLogin();
    check(authResult.response, { ... });
  });

  group('Listagem de Automóveis Disponíveis', function () {  // ← GROUP 2
    const response = http.get(...);
    getCarsAvailableDuration.add(response.timings.duration);
    check(response, { ... });
  });
}
```

**Relatório gerado:**
```
█ Registro de Usuário
  ✓ status do registro é 201
  ✓ resposta do registro contém user

█ Login de Usuário
  ✓ status do login é 200
  ✓ resposta do login contém token

█ Autenticação
  ✓ autenticação bem-sucedida
  ✓ token foi recebido

█ Listagem de Automóveis Disponíveis
  ✓ status da listagem é 200
  ✓ resposta é um array
```

**Explicação:** Groups organizam o teste em seções lógicas e facilitam a análise dos resultados. No relatório, cada group mostra suas próprias métricas (tempo médio, checks, etc.), permitindo identificar rapidamente qual parte do fluxo está lenta ou falhando.

---

### 10. Stages

**O que é:** Configura carga progressiva ao longo do tempo, simulando o ramp-up (crescimento gradual), plateau (carga estável) e ramp-down (redução gradual) de usuários, tornando os testes criados mais parecidos com os cenários que acontecem no nosso do dia a dia.

**Onde aplicado:** [`rental.test.js:14-21`](rental.test.js#L14-L21)

**Código:**
```javascript
// rental.test.js
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
    'http_req_duration': ['p(95)<3000'],
    'create_rental_duration': ['p(95)<2000'],
    'get_user_rentals_duration': ['p(95)<1500'],
    'checks': ['rate>0.95'],
  },
};
```

**Fluxo do teste:**
```javascript
export default function () {
  let authToken, carId;

  // 1. Setup: Autenticação
  group('Setup: Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;
  });

  // 2. Setup: Criação de Carro
  group('Setup: Criação de Carro', function () {
    const carResult = createCar(authToken);
    carId = carResult.car.id;
  });

  // 3. Operação Principal: Criar Aluguel
  group('Operação Principal: Criar Aluguel', function () {
    const rentalResult = createRental(authToken, carId);
    createRentalDuration.add(rentalResult.response.timings.duration);  // ← TREND
  });

  sleep(1);  // Simula comportamento de usuário real

  // 4. Consulta: Listar Meus Aluguéis
  group('Consulta: Listar Meus Aluguéis', function () {
    const rentalsResult = getUserRentals(authToken);
    getUserRentalsDuration.add(rentalsResult.response.timings.duration);  // ← TREND
  });
}
```

**Funções setup() e teardown():**
```javascript
// Executada UMA vez no INÍCIO do teste (antes das stages)
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

// Executada UMA vez no FINAL do teste (depois das stages)
export function teardown(data) {
  console.log('✅ Teste de Rental com STAGES finalizado');
}
```

## ❌ Conceitos NÃO Aplicados

### 11. 📊 Data-Driven Testing

**O que seria:** Iterar sobre múltiplos datasets externos (CSV, JSON) para testar com diferentes combinações de dados.

**Por que não foi aplicado:** Não deu tempo.

**Como seria:**
```javascript
// Exemplo NÃO implementado
import { SharedArray } from 'k6/data';

const testData = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

export default function () {
  const user = testData[__VU % testData.length];
  // testar com user.email, user.password, etc
}
```

---

##  Como Executar os testes

### Pré-requisitos
- K6 instalado 
- API rodando (Por padrão ela roda em : `http://localhost:3000`)

### Comandos

```bash
# Iniciar a API
npm start

# Executa apenas o teste referentes a Api de login
k6 run test/k6/login.test.js

# Executa apenas o teste referentes a Api de carros
k6 run test/k6/car.test.js

# Executa apenas o teste referentes a Api de rentals (com Stages)
k6 run test/k6/rental.test.js

# Executa usando uma URL customizada
k6 run -e BASE_URL=https://api.staging.com test/k6/login.test.js

# Executa com mais detalhes
k6 run --out json=results.json test/k6/car.test.js
```

---

## Relatórios HTML

Os testes geram relatórios HTML automaticamente usando `handleSummary` após cada execução:

```javascript
// Imports no topo
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Função no final do arquivo
export function handleSummary(data) {
  return {
    "test/k6/reports/login-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
```

**Onde aplicado:**
- [`login.test.js:48-53`](login.test.js#L48-L53) → `login-report.html`
- [`car.test.js:65-70`](car.test.js#L65-L70) → `car-report.html`
- [`rental.test.js:149-154`](rental.test.js#L149-L154) → `rental-report.html`

**Como usar:**

```bash
# Executar testes (HTML gerado automaticamente)
npm run k6:login   # → test/k6/reports/login-report.html
npm run k6:car     # → test/k6/reports/car-report.html
npm run k6:rental  # → test/k6/reports/rental-report.html

# Visualizar
open test/k6/reports/login-report.html
```

**Conteúdo:** Taxa de sucesso, tempos de resposta, gráficos interativos, métricas customizadas.

---

## Interpretando Resultados das execuções

### Métricas Importantes

```
http_req_duration.............: avg=150ms min=50ms max=500ms p(95)=300ms
  ✓ threshold met: p(95) < 2000ms

checks.........................: 100.00% ✓ 240 ✗ 0
  ✓ status do registro é 201
  ✓ token foi recebido
  ✓ resposta é um array

get_cars_available_duration...: avg=120ms p(95)=250ms
  ✓ threshold met: p(95) < 2000ms

http_reqs......................: 480 (24/s)
vus............................: 12
```

### O que significa:
- **p(95) < 2000ms**: ✅ 95% das requisições responderam em menos de 2s
- **checks 100%**: ✅ Todas as validações passaram
- **24 req/s**: Taxa de throughput (requisições por segundo)

---



---

##  Histórico de Execução

###  Problema Identificado e Resolvido: JWT Configuration

####  Problema Inicial

Durante a primeira execução dos testes utilizando o K6, identifiquei um erro crítico de autenticação:

```
Status: 401
Body: {"error":"secretOrPrivateKey must have a value"}
```

- O Servidor estava rodando normalmente mas o teste falhava ao ser executado
- O K6 estava fazendo as requisições corretamente (Verificado através de logs)
- A API não conseguia gerar os tokens JWT devido à falta da variável `JWT_SECRET`

**Causa Raiz:**
Depois de muita análise e pesquisa, notei que o arquivo `.env` não existia no projeto, e as variáveis de ambiente necessárias para a geração de tokens JWT não estavam configuradas, causado com isso o problema de autenticação:
- [`src/service/userService.js:7`](src/service/userService.js#L7) - `const JWT_SECRET = process.env.JWT_SECRET;`
- [`src/middleware/auth.js:5`](src/middleware/auth.js#L5) - `const JWT_SECRET = process.env.JWT_SECRET;`

####  Solução Aplicada

1. Criei um arquivo `.env` na raiz do projeto
  
2. Verifiquei se no `src/server.js` o `dotenv` já estava sendo carregado corretamente

####  Resultado Esperado Após Correção

Após reiniciar o servidor com as variáveis de ambiente configuradas:

**Antes (com erro):**
```
✗ Status is 401
✗ Response has token
Body: {"error":"secretOrPrivateKey must have a value"}
```

**Depois (funcionando):**
```
✓ Status is 200
✓ Response has token
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

####  Lições Aprendidas

1. **Configuração de Ambiente é Crítica**: Sempre verificar variáveis de ambiente antes de executar testes!
2. **Documentação Clara**: A api deve ter um arquivo `.env.example` para ajuda novos desenvolvedores a configurar o projeto.
3. **K6 Funciona Perfeitamente**: O erro não estava no K6, mas na configuração do backend.
4. **Erro 401 ≠ Servidor Morto**: Um erro 401 com body JSON é um bom sinal - o servidor está vivo e respondendo

####  Comandos para Reproduzir a Correção

```bash
# 1. Parar o servidor (se estiver rodando)
# Ctrl+C no terminal do servidor

# 2. Verificar se .env existe e está configurado
cat .env

# 3. Iniciar o servidor novamente
npm start

# 4. Executar os testes K6
npm run k6:login   # Teste de autenticação
npm run k6:car     # Teste de listagem de carros
npm run k6:rental  # Teste de aluguéis com stages
```

####  Segurança: Boas Práticas Aplicadas

-  Arquivo `.env` no `.gitignore` (não versionado)
-  Arquivo `.env.example` versionado (sem credenciais)
-  JWT_SECRET configurável por ambiente
-  **Produção**: Usar secret forte gerado via `openssl rand -hex 64`

---


---

## Resumo dos Resultados dos Testes

### Login Test
O teste de autenticação executou 396 iterações com 10 usuários virtuais, gerando 792 requisições totais sem nenhuma falha. Todos os 1584 checks passaram (100%), validando com sucesso o registro e login de usuários. O tempo de resposta P95 ficou em 889ms, bem abaixo do threshold de 2000ms estabelecido, demonstrando excelente performance do fluxo de autenticação.

### Car Test 
O teste de listagem de carros executou 1205 iterações com até 50 usuários virtuais simultâneos, totalizando 3615 requisições. Apesar de todos os 6025 checks terem passado (100%), 2 thresholds foram violados: o tempo de resposta geral P95 atingiu 4632ms (threshold: 2000ms) e a listagem de carros disponíveis P95 chegou a 2062ms (threshold: 500ms). Isso indica que sob carga média (50 VUs), a API apresenta degradação de performance que precisa ser otimizada.

### Rental Test (2025-12-20 13:04)
O teste de aluguéis com stages progressivos executou 195 iterações, variando de 1 a 10 usuários virtuais ao longo de 60 segundos. Foram realizadas 975 requisições com 100% de sucesso nos 1950 checks. Todos os thresholds de performance foram respeitados: criação de rental P95 em 41ms (threshold: 2000ms), listagem P95 em 365ms (threshold: 1000ms) e tempo geral P95 em 463ms (threshold: 3000ms). O teste demonstrou excelente estabilidade da API mesmo com carga progressiva.