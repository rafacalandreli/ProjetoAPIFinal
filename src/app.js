const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const carRoutes = require('./routes/carRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const userRepository = require('./repository/userRepository');
const carRepository = require('./repository/carRepository');
const rentalRepository = require('./repository/rentalRepository');

function createApplication() {
  const app = express();

  // Resetar repositórios para isolamento de testes
  userRepository.users.length = 0;
  carRepository.cars.length = 0;
  rentalRepository.rentals.length = 0;

  // Middleware para parsear JSON
  app.use(express.json());

  // Carregar o arquivo swagger.yaml
  const swaggerDocument = YAML.load(path.join(__dirname, './config/swagger.yaml'));

  // Rota para a documentação Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Rotas da API
  app.use('/users', userRoutes);
  app.use('/cars', carRoutes);
  app.use('/rentals', rentalRoutes);

  return app;
}

module.exports = createApplication;