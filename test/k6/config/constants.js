/**
 * Constantes de Configuração dos Testes K6
 * 
 * Centraliza todos os valores "mágicos" usados nos testes para:
 * - Melhorar legibilidade
 * - Facilitar manutenção
 * - Garantir consistência
 */

// ============================================================================
// STATUS CODES HTTP
// ============================================================================

/**
 * Códigos de status HTTP usados nos testes
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ============================================================================
// THRESHOLDS DE PERFORMANCE
// ============================================================================

/**
 * Limites de tempo de resposta esperados (em milissegundos)
 */
export const PERFORMANCE_THRESHOLDS = {
  VERY_FAST: 200,   // 200ms - operações muito rápidas (cache, validações)
  FAST: 500,        // 500ms - operações rápidas (GET simples)
  NORMAL: 1000,     // 1s - operações normais (POST/PUT simples)
  SLOW: 2000,       // 2s - operações lentas mas aceitáveis
  VERY_SLOW: 3000   // 3s - operações muito lentas (limite máximo)
};

/**
 * Percentis usados para análise de performance
 */
export const PERCENTILES = {
  P50: 50,  // Mediana - metade das requisições
  P90: 90,  // 90% das requisições
  P95: 95,  // 95% das requisições
  P99: 99   // 99% das requisições
};

// ============================================================================
// CONFIGURAÇÕES DE CARGA
// ============================================================================

/**
 * Configurações predefinidas de carga para diferentes tipos de teste
 */
export const LOAD_CONFIG = {
  // Teste de fumaça (smoke test) - verifica se funciona basicamente
  SMOKE: {
    vus: 1,
    duration: '30s'
  },
  
  // Teste leve - validação rápida
  LIGHT: {
    vus: 10,
    duration: '1m'
  },
  
  // Teste médio - carga normal esperada
  MEDIUM: {
    vus: 50,
    duration: '3m'
  },
  
  // Teste pesado - carga de pico
  HEAVY: {
    vus: 100,
    duration: '5m'
  },
  
  // Teste de stress - além do limite
  STRESS: {
    vus: 200,
    duration: '10m'
  }
};

/**
 * Configurações de stages para testes progressivos
 */
export const STAGES_CONFIG = {
  // Stages leves (para desenvolvimento)
  LIGHT: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 10 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 }
  ],
  
  // Stages médios (para testes regulares)
  MEDIUM: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 }
  ],
  
  // Stages pesados (para testes de stress)
  HEAVY: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 }
  ]
};

// ============================================================================
// CONFIGURAÇÕES DE RETRY
// ============================================================================

/**
 * Configurações para retry logic em operações que podem falhar temporariamente
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,        // Número máximo de tentativas
  DELAY_MS: 200,          // Delay entre tentativas (ms)
  EXPONENTIAL_BACKOFF: false  // Se deve usar backoff exponencial
};

// ============================================================================
// THRESHOLDS COMPLETOS
// ============================================================================

/**
 * Conjunto completo de thresholds recomendados
 */
export const RECOMMENDED_THRESHOLDS = {
  // Performance - tempo de resposta
  'http_req_duration': [
    `p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`,
    `p(99)<${PERFORMANCE_THRESHOLDS.VERY_SLOW}`
  ],
  
  // Confiabilidade - taxa de erro
  'http_req_failed': ['rate<0.01'],  // Menos de 1% de falhas
  
  // Qualidade - checks passando
  'checks': ['rate>0.95'],  // Mais de 95% dos checks devem passar
  
  // Conexão
  'http_req_connecting': ['p(95)<100']  // Conexão < 100ms
};

/**
 * Thresholds para operações específicas
 */
export const OPERATION_THRESHOLDS = {
  // Autenticação
  AUTH: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.FAST}`],
    'checks': ['rate>0.98']  // Auth deve ter alta confiabilidade
  },
  
  // Leitura (GET)
  READ: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.FAST}`],
    'checks': ['rate>0.95']
  },
  
  // Escrita (POST/PUT)
  WRITE: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.NORMAL}`],
    'checks': ['rate>0.95']
  },
  
  // Operações complexas
  COMPLEX: {
    'http_req_duration': [`p(95)<${PERFORMANCE_THRESHOLDS.SLOW}`],
    'checks': ['rate>0.90']
  }
};

// ============================================================================
// CONFIGURAÇÕES DE SLEEP
// ============================================================================

/**
 * Tempos de sleep recomendados para simular comportamento de usuário real
 */
export const SLEEP_TIME = {
  THINK_TIME: 1,      // 1s - tempo de "pensar" entre ações
  SHORT_PAUSE: 0.5,   // 500ms - pausa curta
  LONG_PAUSE: 2,      // 2s - pausa longa
  PAGE_LOAD: 3        // 3s - tempo de carregar página
};

// ============================================================================
// MENSAGENS DE ERRO PADRÃO
// ============================================================================

/**
 * Mensagens de erro padronizadas para logs
 */
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Falha na autenticação',
  REGISTRATION_FAILED: 'Falha ao registrar usuário',
  LOGIN_FAILED: 'Falha ao fazer login',
  RESOURCE_NOT_FOUND: 'Recurso não encontrado',
  INVALID_TOKEN: 'Token inválido ou expirado',
  SERVER_ERROR: 'Erro interno do servidor'
};