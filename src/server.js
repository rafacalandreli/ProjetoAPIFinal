require('dotenv').config();
const appModule = require('./app');
const createApplication = appModule.createApplication;
const PORT = process.env.PORT || 3000;

async function startServer() {
  const { app } = await createApplication();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
    console.log(`GraphQL Playground disponível em http://localhost:${PORT}/graphql`);
  });
}

startServer();