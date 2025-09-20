const request = require('supertest');
const createApplication = require('../../src/app');
const { expect } = require('chai');
const messages = require('../../src/config/messages');
const { createTestUserSession } = require('../utils/authHelper');

describe('Testes de API - Aluguéis de Automoveis', () => {
  let authToken = '';
  let userId = '';
  let app;

  beforeEach(async () => {
    app = createApplication(); // Cria uma nova instância da aplicação para cada teste
    const auth = await createTestUserSession(app);
    authToken = auth.authToken;
    userId = auth.userId;
  });

  it('TC 004 - Deve registrar um novo aluguel (autenticado)', async () => {
    const carRes = await request(app)
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

    const res = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: carId,
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 dias no futuro
      });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.RENTAL_REGISTERED_SUCCESS);
    expect(res.body.rental).to.have.property('id');
  });

  it('TC 005 - Não deve alugar carro já alugado (autenticado)', async () => {
    const newCarRes = await request(app)
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

    await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: newCarId,
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 dias no futuro
      });

    const res = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: newCarId,
        startDate: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)).toISOString(),
        expectedEndDate: new Date(Date.now() + (6 * 24 * 60 * 60 * 1000)).toISOString(),
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.CAR_ALREADY_RENTED);
  });

  it('TC 006 - Deve retornar aluguéis do usuário autenticado', async () => {
    const carRes = await request(app)
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

    await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: testCarId,
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      });

    const res = await request(app)
      .get('/api/rentals/user')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body[0]).to.have.property('userId', userId);
  });
});