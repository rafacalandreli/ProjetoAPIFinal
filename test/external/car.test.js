const { expect } = require('chai');
const request = require('supertest');
const messages = require('../../src/config/messages');
const { createTestUserSession } = require('../utils/authHelper');
const userRepository = require('../../src/repository/userRepository'); // Importar userRepository

describe('Testes de API - Automóveis', () => {
  let authToken = '';
  let userId = '';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'; // Manter baseUrl

  beforeEach(async () => {
    userRepository.resetUsers(); // Resetar usuários antes de cada teste
    const auth = await createTestUserSession(baseUrl); // Passar baseUrl
    authToken = auth.authToken;
    userId = auth.userId;
  });


  it('TC 001 - Deve registrar um novo automóvel (autenticado)', async () => {
    const res = await request(baseUrl)
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
    await request(baseUrl)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: uniquePlate,
        dailyRate: 80.00,
      });

    const res = await request(baseUrl)
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
    const carRes = await request(baseUrl)
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

    const res = await request(baseUrl)
      .get('/api/cars/available')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body[0]).to.have.property('isAvailable', true);
  });
});