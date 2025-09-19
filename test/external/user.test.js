const request = require('supertest');
const createApplication = require('../../src/app');
let app;
const { expect } = require('chai');
const messages = require('../../src/config/messages');
const userRepository = require('../../src/repository/userRepository');
const carRepository = require('../../src/repository/carRepository');
const rentalRepository = require('../../src/repository/rentalRepository');

describe('API Usuários', () => {
  let authToken = '';
  let userId = '';

  beforeEach(async () => {
    app = createApplication(); // Cria uma nova instância da aplicação para cada teste
    // Registrar um usuário para ser usado em todos os testes autenticados
    const userRes = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Global Test User',
        email: 'global@example.com',
        cpf: '000.000.000-00',
        password: 'password123',
      });
    userId = userRes.body.user.id;

    // Logar o usuário e obter o token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'global@example.com',
        password: 'password123',
      });
    authToken = loginRes.body.token;
  });

  it.only('POST /api/users/register - Deve registrar um novo usuário', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Teste User',
        email: 'teste@example.com',
        cpf: '123.456.789-00',
        password: 'password123',
      });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.USER_REGISTERED_SUCCESS);
    expect(res.body.user).to.have.property('id');
  });

  it('POST /api/users/register - Não deve registrar usuário com email duplicado', async () => {
    await request(app)
      .post('/api/users/register')
      .send({
        name: 'Teste User Duplicado',
        email: 'duplicado@example.com',
        cpf: '111.111.111-11',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Outro User Duplicado',
        email: 'duplicado@example.com',
        cpf: '222.222.222-22',
        password: 'password123',
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.EMAIL_ALREADY_REGISTERED);
  });

  it('POST /api/users/login - Deve logar um usuário e retornar um token', async () => {
    await request(app)
      .post('/api/users/register')
      .send({
        name: 'Login Test User',
        email: 'logintest@example.com',
        cpf: '333.333.333-33',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'logintest@example.com',
        password: 'password123',
      });
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('GET /api/users - Deve retornar todos os usuários (autenticado)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
  });

  it('GET /api/users/:id - Deve retornar um usuário pelo ID (autenticado)', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('id', userId);
  });
});