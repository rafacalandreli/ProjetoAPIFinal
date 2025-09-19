const createApplication = require('./app');
const PORT = process.env.PORT || 3000;

const app = createApplication();

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
});