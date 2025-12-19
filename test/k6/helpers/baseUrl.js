/**
 * Obtém a URL base da API a partir da variável de ambiente BASE_URL
 * Se não estiver definida, usa o valor padrão localhost:3000
 */
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}