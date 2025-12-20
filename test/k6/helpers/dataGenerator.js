/**
 * K6 Data Generator
 * Importa e re-exporta funções do módulo compartilhado test/shared/dataGenerator.js
 * Também fornece funções adicionais específicas do K6 usando Faker
 */

// ✅ Importar todas as funções do módulo compartilhado
export { 
  generateValidCPF,
  generateUniqueEmail,
  generateRandomName,
  generateTestPassword,
  generateCarPlate,
  generateUserData,
  generateCarData
} from '../../shared/dataGenerator.js';

// Funções específicas do K6 usando Faker (opcional)
import faker from 'k6/x/faker';

/**
 * Gera nome usando Faker do K6 (alternativa mais realista)
 * @returns {string} Nome completo aleatório
 */
export function generateRandomNameWithFaker() {
  return faker.person.name();
}

/**
 * Gera senha aleatória usando Faker do K6
 * @returns {string} Senha aleatória
 */
export function generateRandomPasswordWithFaker() {
  return faker.internet.password();
}