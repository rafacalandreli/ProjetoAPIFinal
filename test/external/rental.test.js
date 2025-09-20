const { expect } = require('chai');
const request = require('supertest');
const messages = require('../../src/config/messages');
const { createTestUserSession } = require('../utils/authHelper');
const userRepository = require('../../src/repository/userRepository'); // Importar userRepository

describe('Testes de API - Aluguéis de Automoveis', () => {
  let authToken = '';
  let userId = '';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  beforeEach(async () => {
    userRepository.resetUsers(); // Resetar usuários antes de cada teste
    const auth = await createTestUserSession(baseUrl);
    authToken = auth.authToken;
    userId = auth.userId;
  });

  it('TC 004 - Deve registrar um novo aluguel (autenticado)', async () => {
    const carRes = await request(baseUrl)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Global Car Brand',
        model: 'Global Car Model',
        year: 2023,
        plate: `GLB-${Date.now().toString().slice(-4)}`,
        dailyRate: 100.00,
      });
    const carId = carRes.body.car.id;

    const res = await request(baseUrl)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: carId,
        userId: userId, // Adicionar userId
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 dias no futuro
      });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.RENTAL_REGISTERED_SUCCESS);
    expect(res.body.rental).to.have.property('id');
  });

  it('TC 005 - Não deve alugar carro já alugado (autenticado)', async () => {
    const newCarRes = await request(baseUrl)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Honda',
        model: 'Civic',
        year: 2022,
        plate: `HND-${Date.now().toString().slice(-4)}`,
        dailyRate: 120.00,
      });
    const newCarId = newCarRes.body.car.id;

    await request(baseUrl)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: newCarId,
        userId: userId, // Adicionar userId
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 dias no futuro
      });

    const res = await request(baseUrl)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: newCarId,
        userId: userId, // Adicionar userId
        startDate: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: new Date(Date.now() + (6 * 24 * 60 * 60 * 1000)).toISOString(),
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.CAR_ALREADY_RENTED);
  });

  it('TC 006 - Deve retornar aluguéis do usuário autenticado', async () => {
    const carRes = await request(baseUrl)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Toyota',
        model: 'Yaris',
        year: 2023,
        plate: `YAR-${Date.now().toString().slice(-4)}`,
        dailyRate: 110.00,
      });
    const testCarId = carRes.body.car.id;

    await request(baseUrl)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: testCarId,
        userId: userId, // Adicionar userId
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      });

    const res = await request(baseUrl)
      .get('/api/rentals/user') // Remover userId da rota
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body[0]).to.have.property('userId', userId);
  });
});