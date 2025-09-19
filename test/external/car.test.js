const request = require('supertest');
const createApplication = require('../../src/app');
let app;
const { expect } = require('chai');
const messages = require('../../src/config/messages');
const userRepository = require('../../src/repository/userRepository');
const carRepository = require('../../src/repository/carRepository');
const rentalRepository = require('../../src/repository/rentalRepository');

describe('API Automóveis', () => {
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

  it('Deve registrar um novo automóvel (autenticado)', async () => {
    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: 'XYZ-5678',
        dailyRate: 80.00,
      });
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('message', messages.CAR_REGISTERED_SUCCESS);
    expect(res.body.car).to.have.property('id');
  });

  it('Não deve registrar automóvel com placa duplicada (autenticado)', async () => {
    await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: 'ABC-1234', // Placa única para este teste
        dailyRate: 80.00,
      });

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Fiat',
        model: 'Uno',
        year: 2020,
        plate: 'ABC-1234',
        dailyRate: 70.00,
      });
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', messages.PLATE_ALREADY_REGISTERED);
  });

  it('Deve retornar automóveis disponíveis (autenticado)', async () => {
    // Registrar um carro para este teste específico
    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        plate: 'COR-1234',
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