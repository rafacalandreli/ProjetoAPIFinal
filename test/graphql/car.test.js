const { ApolloServer, ApolloError } = require('apollo-server-express');
const { createTestClient } = require('apollo-server-testing');
const { expect } = require('chai');
const typeDefs = require('../../src/graphql/schema');
const resolvers = require('../../src/graphql/resolvers');
const carService = require('../../src/service/carService');
const sinon = require('sinon');

describe('GraphQL API - Car Operations', () => {
  let server;
  let query;
  let mutate;

  beforeEach(async () => {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: () => ({ user: { id: 'test-user-id' } }),
    });
    ({ query, mutate } = createTestClient(server));

    sinon.stub(carService, 'registerCar').callsFake(async (brand, model, year, plate, dailyRate) => {
      return { id: 'mock-car-id', brand, model, year, plate, dailyRate, isAvailable: true };
    });
    sinon.stub(carService, 'getAvailableCars').returns([{ id: 'mock-car-id', brand: 'Test Car', model: 'Model X', isAvailable: true }]);
    sinon.stub(carService, 'getCarById').callsFake(async (id) => {
      if (id === 'mock-car-id') return { id: 'mock-car-id', brand: 'Test Car', model: 'Model X', isAvailable: true };
      return null;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('TC 001 - Deve cadastrar um novo carro com sucesso', async () => {
    const REGISTER_CAR = `
      mutation {
        registerCar(brand: "GraphQL Brand", model: "GraphQL Model", year: 2024, plate: "GQL-1234", dailyRate: 99.99) {
          car {
            id
            brand
            model
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: REGISTER_CAR });
    expect(res.data.registerCar.car).to.have.property('brand', 'GraphQL Brand');
    expect(res.data.registerCar).to.have.property('message', 'Car registered successfully');
  });

  it('TC 002 - Não deve registrar carro com placa duplicada', async () => {
    carService.registerCar.restore();
    sinon.stub(carService, 'registerCar').throws(new ApolloError('Plate already registered', 'CAR_REGISTRATION_ERROR'));
    const REGISTER_CAR_DUPLICATE = `
      mutation {
        registerCar(brand: "Duplicate Brand", model: "Duplicate Model", year: 2023, plate: "GQL-1234", dailyRate: 50.00) {
          car {
            id
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: REGISTER_CAR_DUPLICATE });
    expect(res.errors[0].message).to.equal('Plate already registered');
    expect(res.errors[0].extensions.code).to.equal('CAR_REGISTRATION_ERROR');
  });
});