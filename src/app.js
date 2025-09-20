const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const routes = require('./routes');
const userRepository = require('./repository/userRepository');
const carRepository = require('./repository/carRepository');
const rentalRepository = require('./repository/rentalRepository');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

async function createApplication() {
  const app = express();

  // Resetar repositórios para isolamento de testes
  userRepository.resetUsers();
  carRepository.cars.length = 0; // Manter para carRepository
  rentalRepository.rentals.length = 0; // Manter para rentalRepository

  // Middleware para parsear JSON
  app.use(express.json());

  // Carregar o arquivo swagger.yaml
  const swaggerDocument = YAML.load(path.join(__dirname, './config/swagger.yaml'));

  // Rota para a documentação Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Configurar Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      // Você pode adicionar o usuário autenticado ao contexto aqui, se houver
      user: req.user,
    }),
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  // Rotas da API
  app.use('/api', routes);

  return app;
}

module.exports = createApplication;