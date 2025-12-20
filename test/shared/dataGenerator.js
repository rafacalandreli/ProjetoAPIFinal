/**
 * Módulo compartilhado de geração de dados para testes
 * Compatível com Node.js (CommonJS/ES6) e K6 (ES6)
 * 
 * IMPORTANTE: Este arquivo NÃO deve ter dependências externas
 * para ser compatível com ambos os ambientes (Supertest e K6)
 */

/**
 * Gera um CPF válido aleatoriamente com dígitos verificadores.
 * @returns {string} Um CPF válido no formato "XXX.XXX.XXX-XX"
 */
export function generateValidCPF() {
  const generateRandomDigits = (count) => {
    let digits = '';
    for (let i = 0; i < count; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  };

  const calculateVerifierDigit = (cpfBase) => {
    let sum = 0;
    let multiplier = cpfBase.length + 1;
    for (let i = 0; i < cpfBase.length; i++) {
      sum += parseInt(cpfBase[i]) * multiplier;
      multiplier--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  let cpfNineDigits = generateRandomDigits(9);
  let firstVerifier = calculateVerifierDigit(cpfNineDigits);
  let cpfTenDigits = cpfNineDigits + firstVerifier;
  let secondVerifier = calculateVerifierDigit(cpfTenDigits);
  let cpfElevenDigits = cpfTenDigits + secondVerifier;

  return cpfElevenDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera um email único baseado em timestamp
 * @param {string} domain - Domínio do email (padrão: 'test.com')
 * @returns {string} Email único
 */
export function generateUniqueEmail(domain = 'test.com') {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `user_${timestamp}_${randomNum}@${domain}`;
}

/**
 * Gera um nome aleatório simples baseado em timestamp
 * @returns {string} Nome de teste
 */
export function generateRandomName() {
  const timestamp = Date.now();
  return `Test User ${timestamp}`;
}

/**
 * Gera uma senha padrão para testes
 * @returns {string} Senha padrão
 */
export function generateTestPassword() {
  return 'Test@123456';
}

/**
 * Gera uma placa de carro única e válida (formato Mercosul)
 * @returns {string} Placa no formato ABC1D23
 */
export function generateCarPlate() {
  const timestamp = Date.now().toString();
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({length: 3}, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  const numbers = timestamp.slice(-4);
  // Formato Mercosul: ABC1D23 (3 letras, 1 número, 1 letra, 2 números)
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `${randomLetters}${numbers[0]}${randomLetter}${numbers.slice(1, 3)}`;
}

/**
 * Gera dados completos de usuário de teste
 * @param {object} overrides - Campos para sobrescrever
 * @returns {object} Objeto com dados de usuário
 */
export function generateUserData(overrides = {}) {
  const defaultData = {
    name: generateRandomName(),
    email: generateUniqueEmail(),
    cpf: generateValidCPF(),
    password: generateTestPassword()
  };
  
  return {
    ...defaultData,
    ...overrides
  };
}

/**
 * Gera dados completos de carro de teste
 * @param {object} overrides - Campos para sobrescrever
 * @returns {object} Objeto com dados de carro
 */
export function generateCarData(overrides = {}) {
  const defaultData = {
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
    plate: generateCarPlate(),
    dailyRate: 150.00
  };
  
  return {
    ...defaultData,
    ...overrides
  };
}