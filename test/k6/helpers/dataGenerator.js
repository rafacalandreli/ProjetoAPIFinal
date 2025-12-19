import faker from 'k6/x/faker';

/**
 * Gera um nome aleatório usando Faker
 */
export function generateRandomName() {
  return faker.person.name();
}

/**
 * Gera uma senha aleatória usando Faker
 */
export function generateRandomPassword() {
  return faker.internet.password();
}

/**
 * Gera um email único baseado em timestamp
 */
export function generateUniqueEmail() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `user_${timestamp}_${randomNum}@test.com`;
}

/**
 * Gera um CPF único baseado em timestamp
 */
export function generateUniqueCPF() {
  const timestamp = Date.now().toString();
  // Pega os últimos 11 dígitos do timestamp e formata como CPF
  const cpfNumbers = timestamp.slice(-11).padStart(11, '0');
  return `${cpfNumbers.slice(0, 3)}.${cpfNumbers.slice(3, 6)}.${cpfNumbers.slice(6, 9)}-${cpfNumbers.slice(9, 11)}`;
}