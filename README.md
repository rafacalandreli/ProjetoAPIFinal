# API de Locadora de Veículos

Esta é uma API RESTful para gerenciar uma locadora de veículos, construída com Node.js, Express e documentada com Swagger.

## Funcionalidades

- Registro de usuário (com autenticação obrigatória para todas as demais operações).
- Login de usuário.
- Consulta de usuários.
- Cadastro de automóveis.
- Consulta de automóveis disponíveis.
- Registro de aluguéis de veículos.
- Consulta de aluguéis por usuário.

## Regras de Negócio

1. Para logar é necessário informar login e senha válidos.
2. Não deve ser possível registrar usuários duplicados (mesmo e-mail ou CPF).
3. Não deve ser possível cadastrar automóveis duplicados (mesma placa).
4. Um automóvel só pode ser alugado se estiver disponível (não alugado em outro contrato ativo).
5. Um usuário não pode ter mais de 2 aluguéis ativos ao mesmo tempo.
6. O aluguel deve registrar: usuário, automóvel, data de início e data prevista de término.

## Configuração e Execução

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Instalação

1. Clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd ProjetoApiFinal
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

### Execução

Para iniciar a API, execute o seguinte comando:

```bash
node src/server.js
```

A API estará disponível em `http://localhost:3000` (ou na porta definida pela variável de ambiente `PORT`).

### Documentação da API (Swagger)

A documentação interativa da API estará disponível em `http://localhost:3000/api-docs` após a inicialização do servidor.

## Testes

Para executar os testes, utilize os seguintes comandos:

- **Executar todos os testes:**
  ```bash
  npm test
  ```

- **Executar testes de integração (external):**
  ```bash
  npm run test-external
  ```

- **Executar testes de controller:**
  ```bash
  npm run test-controller
  ```

- **Executar testes GraphQL:**
  ```bash
  npm run test-graphql
  ```

- **Executar testes em paralelo (external e GraphQL):**
  ```bash
  npm run test-parallel
  ```