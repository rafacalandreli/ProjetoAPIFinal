const { ApolloServer, ApolloError } = require('apollo-server-express');
const { createTestClient } = require('apollo-server-testing');
const { expect } = require('chai');
const typeDefs = require('../../src/graphql/schema');
const resolvers = require('../../src/graphql/resolvers');
const userService = require('../../src/service/userService');
const sinon = require('sinon');

describe('GraphQL API - User Operations', () => {
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

    sinon.stub(userService, 'registerUser').callsFake(async (name, email, cpf, password) => {
      return { id: 'mock-user-id', name, email, cpf };
    });
    sinon.stub(userService, 'loginUser').callsFake(async (email, password) => {
      return { token: 'mock-jwt-token', user: { id: 'mock-user-id', email } };
    });
    sinon.stub(userService, 'getAllUsers').resolves([{ id: 'mock-user-id', name: 'Test User', email: 'test@example.com', cpf: '123' }]);
    sinon.stub(userService, 'getUserById').callsFake(async (id) => {
      if (id === 'mock-user-id') return { id: 'mock-user-id', name: 'Test User', email: 'test@example.com', cpf: '123' };
      return null;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('TC 001 - Deve buscar todos os usuários', async () => {
    const GET_USERS = `
      query {
        users {
          id
          name
          email
          cpf
        }
      }
    `;
    const res = await query({ query: GET_USERS });
    expect(res.data.users).to.be.an('array');
    expect(res.data.users[0]).to.have.property('name', 'Test User');
  });

  it('TC 002 - Deve registrar um novo usuário', async () => {
    const REGISTER_USER = `
      mutation {
        registerUser(name: "New GraphQL User", email: "graphql@example.com", cpf: "111.222.333-44", password: "password123") {
          user {
            id
            name
            email
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: REGISTER_USER });
    expect(res.data.registerUser.user).to.have.property('name', 'New GraphQL User');
    expect(res.data.registerUser).to.have.property('message', 'User registered successfully');
  });

  it('TC 003 - Deve logar um usuário e retornar um token e dados do usuário', async () => {
    const LOGIN_USER = `
      mutation {
        loginUser(email: "test@example.com", password: "password123") {
          token
          user {
            id
            email
          }
        }
      }
    `;
    const res = await mutate({ mutation: LOGIN_USER });
    expect(res.data.loginUser).to.have.property('token', 'mock-jwt-token');
    expect(res.data.loginUser.user).to.have.property('id', 'mock-user-id');
    expect(res.data.loginUser.user).to.have.property('email', 'test@example.com');
  });
  it('TC 004 - Não deve registrar usuário com email duplicado', async () => {
    userService.registerUser.restore();
    sinon.stub(userService, 'registerUser').throws(new ApolloError('Email already registered', 'REGISTRATION_ERROR'));
    const REGISTER_USER_DUPLICATE = `
      mutation {
        registerUser(name: "Duplicate User", email: "graphql@example.com", cpf: "555.666.777-88", password: "password123") {
          user {
            id
          }
          message
        }
      }
    `;
    const res = await mutate({ mutation: REGISTER_USER_DUPLICATE });
    expect(res.errors[0].message).to.equal('Email already registered');
    expect(res.errors[0].extensions.code).to.equal('REGISTRATION_ERROR');
  });

  it('TC 005 - Não deve logar com credenciais inválidas', async () => {
    userService.loginUser.restore();
    sinon.stub(userService, 'loginUser').throws(new ApolloError('Invalid credentials', 'AUTHENTICATION_ERROR'));
    const LOGIN_INVALID = `
      mutation {
        loginUser(email: "test@example.com", password: "wrongpassword") {
          token
        }
      }
    `;
    const res = await mutate({ mutation: LOGIN_INVALID });
    expect(res.errors[0].message).to.equal('Invalid credentials');
    expect(res.errors[0].extensions.code).to.equal('AUTHENTICATION_ERROR');
  });
});