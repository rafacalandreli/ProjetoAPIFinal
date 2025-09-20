const { expect } = require('chai');
const request = require('supertest');
const messages = require('../../src/config/messages');
const { createTestUserSession, registerNewUserTest, buildTestUserData } = require('../utils/authHelper');
const userRepository = require('../../src/repository/userRepository'); // Importar userRepository

describe('Testes de API - Usuários Scenarios', () => {
  let authToken = '';
  let userId = '';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  let auth;

  beforeEach(async () => {
    userRepository.resetUsers(); // Resetar usuários antes de cada teste
    auth = await createTestUserSession(baseUrl);
    authToken = auth.authToken;
    userId = auth.userId;
  });


  it('TC 007 - Deve registrar um novo usuário', async () => {
    const userData = buildTestUserData({ name: 'New User' });
    const res = await registerNewUserTest(baseUrl, userData);
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.USER_REGISTERED_SUCCESS);
    expect(res.body.user).to.have.property('id');
  });

  it('TC 008 - Não deve registrar usuário com email duplicado', async () => {
    const res = await request(baseUrl)
      .post('/api/users/register')
      .send({
        name: 'Outro User Duplicado',
        email: auth.userEmail,
        cpf: `222.222.222-${Date.now().toString().slice(-2)}`,
        password: 'password123',
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.EMAIL_ALREADY_REGISTERED);
  });

  it('TC 009 - Deve logar um usuário e retornar um token', async () => {
    const res = await request(baseUrl)
      .post('/api/users/login')
      .send({
        email: auth.userEmail,
        password: 'password123',
      });
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('TC 010 - Deve retornar todos os usuários (autenticado)', async () => {
    const res = await request(baseUrl)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
  });

  it('TC 011 - Deve retornar um usuário pelo ID (autenticado)', async () => {
    const res = await request(baseUrl)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('id', userId);
  });
});