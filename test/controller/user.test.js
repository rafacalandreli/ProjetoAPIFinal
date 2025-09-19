const { expect } = require("chai");
const sinon = require("sinon");
const userController = require("../../src/controller/userController");
const userService = require("../../src/service/userService");
const messages = require("../../src/config/messages");

describe("US 001- User Validations", () => {
  let registerUserStub;
  let loginUserStub;
  let getAllUsersStub;
  let getUserByIdStub;

  beforeEach(() => {
    registerUserStub = sinon.stub(userService, "registerUser");
    loginUserStub = sinon.stub(userService, "loginUser");
    getAllUsersStub = sinon.stub(userService, "getAllUsers");
    getUserByIdStub = sinon.stub(userService, "getUserById");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Cadastrar Usuario", () => {
    it("TC 001 - Registrar um usuario com sucesso", async () => {
      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          cpf: "123.456.789-00",
          password: "password123",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      registerUserStub.resolves({
        id: "some-uuid",
        name: "Test User",
        email: "test@example.com",
        cpf: "123.456.789-00",
      });

      await userController.register(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(
        res.json.calledWith({
          message: messages.USER_REGISTERED_SUCCESS,
          user: {
            id: "some-uuid",
            name: "Test User",
            email: "test@example.com",
            cpf: "123.456.789-00",
          },
        })
      ).to.be.true;
    });

    it("TC 002 - Não pode registar o mesmo usuario duas vezes", async () => {
      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          cpf: "123.456.789-00",
          password: "password123",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      registerUserStub.throws(new Error(messages.EMAIL_ALREADY_REGISTERED));

      await userController.register(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: messages.EMAIL_ALREADY_REGISTERED }))
        .to.be.true;
    });

    it("TC 003 - Listar todos os usuarios", async () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      getAllUsersStub.resolves([
        { id: "uuid1", name: "User 1", email: "user1@example.com", cpf: "111" },
        { id: "uuid2", name: "User 2", email: "user2@example.com", cpf: "222" },
      ]);

      await userController.getAllUsers(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith([
          {
            id: "uuid1",
            name: "User 1",
            email: "user1@example.com",
            cpf: "111",
          },
          {
            id: "uuid2",
            name: "User 2",
            email: "user2@example.com",
            cpf: "222",
          },
        ])
      ).to.be.true;
    });

    it("TC 004 - Listar usuarios por ID", async () => {
      const req = { params: { id: "some-uuid" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      getUserByIdStub.resolves({
        id: "some-uuid",
        name: "Test User",
        email: "test@example.com",
        cpf: "123",
      });

      await userController.getUserById(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({
          id: "some-uuid",
          name: "Test User",
          email: "test@example.com",
          cpf: "123",
        })
      ).to.be.true;
    });

    it("TC 005 - Exibir mensagem ao buscar via ID por usuarios que não existem ", async () => {
      const req = { params: { id: "non-existent-uuid" } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      getUserByIdStub.resolves(null);

      await userController.getUserById(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: messages.USER_NOT_FOUND })).to.be
        .true;
    });
  });

  describe("Realizar login do Usuario", () => {
    it("TC 001 - Realizar o login com sucesso", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      loginUserStub.resolves({ token: "some-jwt-token" });

      await userController.login(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({
          message: messages.LOGIN_SUCCESS,
          token: "some-jwt-token",
        })
      ).to.be.true;
    });

    it("TC 002 - Não pode realizar o login com as credencias invalidas", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      loginUserStub.throws(new Error(messages.INVALID_CREDENTIALS));

      await userController.login(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: messages.INVALID_CREDENTIALS })).to.be
        .true;
    });
  });
});
