const request = require('supertest');
const createApplication = require('../../src/app');
let app;
const { expect } = require('chai');
const messages = require('../../src/config/messages');
const userRepository = require('../../src/repository/userRepository');
const carRepository = require('../../src/repository/carRepository');
const rentalRepository = require('../../src/repository/rentalRepository');

describe('API Aluguéis de Automoveis', () => {
  let authToken = '';
  let userId = '';
  let carId = '';

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

    // Registrar um carro para ser usado em testes de aluguel
    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Global Car Brand',
        model: 'Global Car Model',
        year: 2023,
        plate: 'GLB-0000',
        dailyRate: 100.00,
      });
    carId = carRes.body.car.id;
  });

  it('POST /api/rentals - Deve registrar um novo aluguel (autenticado)', async () => {
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

  it('POST /api/rentals - Não deve alugar carro já alugado (autenticado)', async () => {
    // Registrar um novo carro para este teste específico
    const newCarRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Honda',
        model: 'Civic',
        year: 2022,
        plate: 'HND-4321',
        dailyRate: 120.00,
      });
    const newCarId = newCarRes.body.car.id;

    // Primeiro aluguel
    await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        carId: newCarId,
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 dias no futuro
      });

    // Segundo aluguel do mesmo carro
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

  it('GET /api/rentals/user - Deve retornar aluguéis do usuário autenticado', async () => {
    // Registrar um carro para este teste específico
    const carRes = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Toyota',
        model: 'Yaris',
        year: 2023,
        plate: 'YAR-5678',
        dailyRate: 110.00,
      });
    const testCarId = carRes.body.car.id;

    // Criar um aluguel para o usuário autenticado
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