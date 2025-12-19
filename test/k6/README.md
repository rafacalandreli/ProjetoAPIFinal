# 📊 Testes de Performance K6 - API Locadora de Veículos

Este documento demonstra os conceitos de performance testing aplicados nos testes K6 desta API.

## 📁 Estrutura do Projeto

```
test/k6/
├── helpers/
│   ├── authHelper.js      # Funções de autenticação
│   ├── baseUrl.js         # Gerenciamento de URL base
│   ├── dataGenerator.js   # Geração de dados aleatórios
│   ├── carHelper.js       # Funções de gerenciamento de carros
│   └── rentalHelper.js    # Funções de gerenciamento de aluguéis
├── login.test.js          # Teste de registro e login
├── car.test.js            # Teste de listagem de carros
├── rental.test.js         # Teste de aluguéis com Stages
└── README.md              # Este arquivo
```

---

## ✅ Conceitos Aplicados

### 1. 🎯 Thresholds

**O que é:** Define critérios de sucesso/falha baseados em métricas. Se não forem atingidos, o teste falha.

**Onde aplicado:**
- [`login.test.js:9-11`](login.test.js#L9-L11)
- [`car.test.js:13-16`](car.test.js#L13-L16)

**Código:**
```javascript
export const options = {
  vus: 12,
  duration: '20s',
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // ← THRESHOLD: p95 < 2 segundos
    'get_cars_available_duration': ['p(95)<2000'], // ← THRESHOLD customizado
  },
};
```

**Explicação:** Se 95% das requisições demorarem mais de 2 segundos, o teste é considerado FALHO. Isso garante que a API mantenha performance aceitável mesmo sob carga.

---

### 2. ✔️ Checks

**O que é:** Validações que verificam se a resposta está correta, mas não interrompem a execução do teste.

**Onde aplicado:**
- [`login.test.js:19-26`](login.test.js#L19-L26)
- [`car.test.js:27-31`](car.test.js#L27-L31)
- [`car.test.js:46-58`](car.test.js#L46-L58)

**Código:**
```javascript
// Em login.test.js
check(registrationResult.response, {
  'status do registro é 201': (r) => r.status === 201,  // ← CHECK 1
  'resposta do registro contém user': (r) => {          // ← CHECK 2
    const body = JSON.parse(r.body);
    return body.user !== undefined;
  }
});

// Em car.test.js
check(response, {
  'status da listagem é 200': (r) => r.status === 200,     // ← CHECK 1
  'resposta é um array': (r) => {                          // ← CHECK 2
    try {
      const body = JSON.parse(r.body);
      return Array.isArray(body);
    } catch (e) {
      return false;
    }
  },
  'token de autorização foi aceito': (r) => r.status !== 401  // ← CHECK 3
});
```

**Explicação:** Cada check registra pass/fail no relatório final. Diferente de assertions, checks não param o teste se falharem, permitindo coletar mais dados sobre o comportamento sob carga.

---

### 3. 🔧 Helpers

**O que é:** Funções reutilizáveis que encapsulam lógica comum, promovendo o princípio DRY (Don't Repeat Yourself).

**Onde aplicado:**
- [`helpers/authHelper.js`](helpers/authHelper.js) - funções de autenticação
- [`helpers/baseUrl.js`](helpers/baseUrl.js) - gerenciamento de URL
- [`helpers/dataGenerator.js`](helpers/dataGenerator.js) - geração de dados

**Código:**
```javascript
// helpers/authHelper.js
export function registerUser() {
  const baseUrl = getBaseUrl();
  const userData = {
    name: generateRandomName(),        // ← usando outro helper
    email: generateUniqueEmail(),      // ← usando outro helper
    cpf: generateUniqueCPF(),          // ← usando outro helper
    password: generateRandomPassword() // ← usando outro helper
  };
  // ... faz o registro
  return { email: userData.email, password: userData.password, response };
}

export function login(email, password) {
  // ... faz o login
  return { token, response };
}

export function registerAndLogin() {
  const { email, password } = registerUser();  // ← reusa registerUser
  const { token, response } = login(email, password);  // ← reusa login
  return { token, email, password, response };
}
```

**Uso nos testes:**
```javascript
// login.test.js
import { registerUser, login } from './helpers/authHelper.js';

const registrationResult = registerUser();  // ← usando helper
const loginResult = login(userEmail, userPassword);  // ← usando helper

// car.test.js
import { registerAndLogin } from './helpers/authHelper.js';

const authResult = registerAndLogin();  // ← usando helper composto
```

**Explicação:** Helpers eliminam duplicação de código. A função `registerAndLogin()` é especialmente poderosa pois compõe dois helpers (`registerUser` + `login`) criando uma função de nível superior para cenários completos de autenticação.

---

### 4. 📈 Trends

**O que é:** Métrica customizada do K6 para rastrear valores numéricos ao longo do tempo (ex: tempo de resposta).

**Onde aplicado:** [`car.test.js:8`](car.test.js#L8) e [`car.test.js:44`](car.test.js#L44)

**Código:**
```javascript
import { Trend } from 'k6/metrics';

// Criando a métrica customizada
const getCarsAvailableDuration = new Trend('get_cars_available_duration');

export default function () {
  // ... autenticação
  
  group('Listagem de Automóveis Disponíveis', function () {
    const response = http.get(`${baseUrl}/api/cars/available`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Registrando o valor na métrica customizada
    getCarsAvailableDuration.add(response.timings.duration);  // ← TREND
    
    // ... checks
  });
}
```

**Explicação:** A Trend `get_cars_available_duration` rastreia especificamente o tempo de resposta do endpoint `/api/cars/available`, permitindo análise isolada deste endpoint crítico. No relatório final, teremos estatísticas separadas (min, max, avg, p95) apenas para este endpoint.

---

### 5. 🎲 Faker

**O que é:** Biblioteca para gerar dados realistas e aleatórios (nomes, emails, senhas, etc).

**Onde aplicado:** [`helpers/dataGenerator.js:1-17`](helpers/dataGenerator.js#L1-L17)

**Código:**
```javascript
import faker from 'k6/x/faker';  // ← IMPORTANDO FAKER

export function generateRandomName() {
  return faker.person.name();  // ← FAKER gerando nome
}

export function generateRandomPassword() {
  return faker.internet.password();  // ← FAKER gerando senha
}

export function generateUniqueEmail() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `user_${timestamp}_${randomNum}@test.com`;  // ← Email único
}

export function generateUniqueCPF() {
  const timestamp = Date.now().toString();
  const cpfNumbers = timestamp.slice(-11).padStart(11, '0');
  return `${cpfNumbers.slice(0, 3)}.${cpfNumbers.slice(3, 6)}.${cpfNumbers.slice(6, 9)}-${cpfNumbers.slice(9, 11)}`;
}
```

**Uso:**
```javascript
// helpers/authHelper.js
import { generateRandomName, generateRandomPassword, generateUniqueEmail, generateUniqueCPF } from './dataGenerator.js';

const userData = {
  name: generateRandomName(),        // ← "John Doe", "Maria Silva", etc
  email: generateUniqueEmail(),      // ← "user_1703012345_9876@test.com"
  cpf: generateUniqueCPF(),          // ← "123.456.789-01"
  password: generateRandomPassword() // ← "aB3$xY9z@K"
};
```

**Explicação:** Faker gera dados realistas para simular usuários reais. Cada usuário virtual (VU) cria dados únicos, evitando conflitos de duplicação (mesmos emails/CPFs) que causariam erros 400.

---

### 6. 🌍 Variável de Ambiente

**O que é:** Permite configurar valores externamente via linha de comando, sem modificar o código.

**Onde aplicado:** [`helpers/baseUrl.js:5-7`](helpers/baseUrl.js#L5-L7)

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

### 7. ♻️ Reaproveitamento de Resposta

**O que é:** Usar dados de uma requisição anterior em requisições subsequentes.

**Onde aplicado:**
- [`login.test.js:17-33`](login.test.js#L17-L33)
- [`car.test.js:22-32`](car.test.js#L22-L32)

**Código:**
```javascript
// login.test.js
export default function () {
  let userEmail, userPassword;  // ← variáveis para armazenar

  group('Registro de Usuário', function () {
    const registrationResult = registerUser();
    
    // Armazenando dados para reutilizar
    userEmail = registrationResult.email;      // ← CAPTURA
    userPassword = registrationResult.password; // ← CAPTURA
  });

  group('Login de Usuário', function () {
    // Reutilizando dados do registro anterior
    const loginResult = login(userEmail, userPassword);  // ← REUSO
  });
}

// car.test.js
export default function () {
  let authToken;  // ← variável para armazenar token

  group('Autenticação', function () {
    const authResult = registerAndLogin();
    authToken = authResult.token;  // ← CAPTURA o token
  });

  group('Listagem de Automóveis Disponíveis', function () {
    const response = http.get(`${baseUrl}/api/cars/available`, {
      headers: {
        'Authorization': `Bearer ${authToken}`  // ← REUSO do token
      }
    });
  });
}
```

**Explicação:** Simula fluxo real de usuário: registrar → fazer login com mesmas credenciais → usar token em requisições autenticadas. Evita criar dados desnecessários e testa a integração entre endpoints.

---

### 8. 🔐 Uso de Token de Autenticação

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

### 9. 📦 Groups

**O que é:** Organiza testes em blocos lógicos, permitindo métricas agregadas por funcionalidade.

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

### 10. 🎭 Stages

**O que é:** Configura carga progressiva ao longo do tempo, simulando ramp-up (crescimento gradual), plateau (carga estável) e ramp-down (redução gradual) de usuários.

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

**Visualização das Stages:**
```
Usuários
   10 │         ┌─────────────────┐
      │        ╱                   ╲
    5 │   ┌──╱                      ╲
      │  ╱                            ╲──┐
    0 ├─╯                                 ╲─┐
      └─────────────────────────────────────
      0s  10s    30s        60s   75s    85s
      │    │      │          │     │      │
      │    └─ Ramp-up 1      │     │      │
      │           └─ Ramp-up 2     │      │
      │                  └─ Plateau│      │
      │                        └─ Ramp-down 1
      │                                └─ Ramp-down 2
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

**Por que usar Stages?**

1. **Realismo**: Simula crescimento orgânico de usuários (não todos de uma vez)
2. **Estabilização**: Permite que a API se estabilize durante o ramp-up
3. **Identificação de limites**: Descobre em qual nível de carga a performance degrada
4. **Testes de recuperação**: Ramp-down verifica se a API se recupera após pico de carga
5. **Evita sobrecarga instantânea**: Mais seguro para ambientes de produção

**Diferença entre VUs fixos vs Stages:**

```javascript
// VUs FIXOS (login.test.js, car.test.js)
// Todos os 12 usuários começam simultaneamente
export const options = {
  vus: 12,
  duration: '20s'
};

// STAGES (rental.test.js)
// Usuários crescem/diminuem gradualmente
export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 10 },
    // ...
  ]
};
```

**Explicação:** Stages é ideal para testes de stress e spike testing, onde queremos observar como a API se comporta com carga crescente. O teste de rental usa este conceito para simular um cenário mais realista de crescimento de usuários ao longo do tempo, permitindo identificar o ponto exato onde a performance começa a degradar.

---

## ❌ Conceitos NÃO Aplicados

### 11. 📊 Data-Driven Testing

**O que seria:** Iterar sobre múltiplos datasets externos (CSV, JSON) para testar com diferentes combinações de dados.

**Por que não foi aplicado:** Não era requisito. O teste gera dados dinamicamente com Faker, que é mais eficiente para testes de carga.

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

## 🚀 Como Executar

### Pré-requisitos
- K6 instalado
- API rodando (padrão: `http://localhost:3000`)

### Comandos

```bash
# Iniciar a API
npm start

# Executar teste de login
k6 run test/k6/login.test.js

# Executar teste de carros
k6 run test/k6/car.test.js

# Executar teste de rentals (com Stages)
k6 run test/k6/rental.test.js

# Executar com URL customizada
k6 run -e BASE_URL=https://api.staging.com test/k6/login.test.js

# Executar com mais detalhes
k6 run --out json=results.json test/k6/car.test.js
```

---

## 📊 Interpretando Resultados

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

## 📝 Resumo dos Conceitos

| # | Conceito | Status | Localização |
|---|----------|--------|-------------|
| 1 | Thresholds | ✅ Aplicado | `login.test.js:9`, `car.test.js:13`, `rental.test.js:22` |
| 2 | Checks | ✅ Aplicado | `login.test.js:19-33`, `car.test.js:27-58`, `rental.test.js:39-117` |
| 3 | Helpers | ✅ Aplicado | `helpers/*.js` |
| 4 | Trends | ✅ Aplicado | `car.test.js:8,44`, `rental.test.js:11-12,81,106` |
| 5 | Faker | ✅ Aplicado | `helpers/dataGenerator.js:1-17` |
| 6 | Variável de Ambiente | ✅ Aplicado | `helpers/baseUrl.js:5-7` |
| 7 | Reaproveitamento de Resposta | ✅ Aplicado | `login.test.js:22-28`, `car.test.js:24-31`, `rental.test.js:35-71` |
| 8 | Token de Autenticação | ✅ Aplicado | `car.test.js:24-42`, `rental.test.js:35-46` |
| 9 | Groups | ✅ Aplicado | `login.test.js:17-33`, `car.test.js:22-60`, `rental.test.js:35-122` |
| 10 | Stages | ✅ Aplicado | `rental.test.js:14-21` |
| 11 | Data-Driven Testing | ❌ Não aplicado | - |

**Total: 10/11 conceitos implementados** ✅

---

## 🎓 Conclusão

Os testes implementam as melhores práticas de K6 com foco em:
- **Reutilização**: Helpers reduzem duplicação
- **Manutenibilidade**: Código organizado e bem estruturado
- **Observabilidade**: Checks, Trends e Groups fornecem métricas detalhadas
- **Flexibilidade**: Variável de ambiente permite múltiplos ambientes
- **Realismo**: Faker gera dados realistas, Token JWT simula autenticação real