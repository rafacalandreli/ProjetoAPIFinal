const request = require('supertest');
const createApplication = require('../../src/app');
const { expect } = require('chai');
const messages = require('../../src/config/messages');
const { createTestUserSession } = require('../utils/authHelper');

describe('Testes de API - Automóveis', () => {
  let authToken = '';
  let userId = '';
  let app;

  beforeEach(async () => {
    app = createApplication(); // Cria uma nova instância da aplicação para cada teste
    const auth = await createTestUserSession(app);
    authToken = auth.authToken;
    userId = auth.userId;
  });

  it('TC 001 - Deve registrar um novo automóvel (autenticado)', async () => {
    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: `XYZ-${Date.now().toString().slice(-4)}`,
        dailyRate: 80.00,
      });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.CAR_REGISTERED_SUCCESS);
    expect(res.body.car).to.have.property('id');
  });

  it('TC 002 - Não deve registrar automóvel com placa duplicada (autenticado)', async () => {
    const uniquePlate = `DUP-${Date.now().toString().slice(-4)}`;
    await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: uniquePlate,
        dailyRate: 80.00,
      });

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Fiat',
        model: 'Uno',
        year: 2020,
        plate: uniquePlate,
        dailyRate: 70.00,
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.PLATE_ALREADY_REGISTERED);
  });

  it('TC 003 - Deve retornar automóveis disponíveis (autenticado)', async () => {
    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        plate: `COR-${Date.now().toString().slice(-4)}`,
        dailyRate: 150.00,
      });
    const testCarId = carRes.body.car.id;

    const res = await request(app)
      .get('/api/cars/available')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body[0]).to.have.property('isAvailable', true);
  });
});