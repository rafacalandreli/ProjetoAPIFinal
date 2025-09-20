const { ApolloServer, ApolloError } = require('apollo-server-express');
const { createTestClient } = require('apollo-server-testing');
const { expect } = require('chai');
const typeDefs = require('../../src/graphql/schema');
const resolvers = require('../../src/graphql/resolvers');
const rentalService = require('../../src/service/rentalService');
const sinon = require('sinon');

describe('GraphQL API - Rental Operations', () => {
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

    sinon.stub(rentalService, 'createRental').callsFake(async (userId, carId, startDate, expectedEndDate) => {
      return { id: 'mock-rental-id', userId, carId, startDate, expectedEndDate };
    });
    sinon.stub(rentalService, 'getAllRentals').returns([{ id: 'mock-rental-id', userId: 'test-user-id', carId: 'mock-car-id' }]);
    sinon.stub(rentalService, 'getRentalById').callsFake(async (id) => {
      if (id === 'mock-rental-id') return { id: 'mock-rental-id', userId: 'test-user-id', carId: 'mock-car-id' };
      return null;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('TC 001 - Deve criar um novo aluguel com sucesso', async () => {
    const CREATE_RENTAL = `
      mutation {
        createRental(carId: "mock-car-id", startDate: "2025-01-01T00:00:00Z", expectedEndDate: "2025-01-05T00:00:00Z") {
          rental {
            id
            carId
            userId
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: CREATE_RENTAL });
    expect(res.data.createRental.rental).to.have.property('carId', 'mock-car-id');
    expect(res.data.createRental.rental).to.have.property('userId', 'test-user-id');
    expect(res.data.createRental).to.have.property('message', 'Rental registered successfully');
  });

  it('TC 002 - Não deve criar aluguel se o carro já estiver alugado', async () => {
    rentalService.createRental.restore();
    sinon.stub(rentalService, 'createRental').throws(new ApolloError('Car already rented', 'RENTAL_CREATION_ERROR'));
    const CREATE_RENTAL_DUPLICATE_CAR = `
      mutation {
        createRental(carId: "mock-car-id", startDate: "2025-01-01T00:00:00Z", expectedEndDate: "2025-01-05T00:00:00Z") {
          rental {
            id
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: CREATE_RENTAL_DUPLICATE_CAR });
    expect(res.errors[0].message).to.equal('Car already rented');
    expect(res.errors[0].extensions.code).to.equal('RENTAL_CREATION_ERROR');
  });

  it('TC 003 - Não deve criar aluguel se o usuário exceder o limite de aluguéis ativos', async () => {
    rentalService.createRental.restore();
    sinon.stub(rentalService, 'createRental').throws(new ApolloError('User has two active rentals', 'RENTAL_CREATION_ERROR'));
    const CREATE_RENTAL_MAX_EXCEEDED = `
      mutation {
        createRental(carId: "another-mock-car-id", startDate: "2025-01-01T00:00:00Z", expectedEndDate: "2025-01-05T00:00:00Z") {
          rental {
            id
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: CREATE_RENTAL_MAX_EXCEEDED });
    expect(res.errors[0].message).to.equal('User has two active rentals');
    expect(res.errors[0].extensions.code).to.equal('RENTAL_CREATION_ERROR');
  });
});