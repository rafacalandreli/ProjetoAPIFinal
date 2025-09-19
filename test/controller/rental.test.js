const { expect } = require('chai');
const sinon = require('sinon');
const rentalController = require('../../src/controller/rentalController');
const rentalService = require('../../src/service/rentalService');
const messages = require('../../src/config/messages');

describe('US 003 - Rental Validations', () => {
  let createRentalStub;
  let getRentalsByUserStub;

  beforeEach(() => {
    createRentalStub = sinon.stub(rentalService, 'createRental');
    getRentalsByUserStub = sinon.stub(rentalService, 'getRentalsByUser');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('TC 001 - Realizar o aluguel com sucesso', async () => {
    const req = {
      user: { id: 'some-user-id' }, // Mocking req.user.id
      body: {
        carId: 'some-car-id',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    createRentalStub.resolves({
      id: 'some-rental-id',
      userId: req.user.id,
      carId: req.body.carId,
      startDate: req.body.startDate,
      expectedEndDate: req.body.expectedEndDate,
    });

    await rentalController.createRental(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith({
      message: messages.RENTAL_REGISTERED_SUCCESS,
      rental: {
        id: 'some-rental-id',
        userId: req.user.id,
        carId: req.body.carId,
        startDate: req.body.startDate,
        expectedEndDate: req.body.expectedEndDate,
      },
    })).to.be.true;
  });

  it('TC 002 - Não pode alugar novamente o mesmo carro', async () => {
    const req = {
      user: { id: 'some-user-id' }, // Mocking req.user.id
      body: {
        carId: 'already-rented-car-id',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    createRentalStub.throws(new Error(messages.CAR_ALREADY_RENTED));

    await rentalController.createRental(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ error: messages.CAR_ALREADY_RENTED })).to.be.true;
  });

  it('TC 003 - Não deve permitir alugar caso o usuario tenha muitos alugueis ativos', async () => {
    const req = {
      user: { id: 'user-with-max-rentals' }, // Mocking req.user.id
      body: {
        carId: 'some-car-id',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    createRentalStub.throws(Object.assign(new Error(''), { message: messages.MAX_RENTALS_EXCEEDED }));

    await rentalController.createRental(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ error: messages.MAX_RENTALS_EXCEEDED })).to.be.true;
  });

  it('TC 004 - Visualizar os alugueis feitos pelo usuario via ID', async () => {
    const req = { user: { id: 'some-user-id' } }; // Mocking req.user.id
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    getRentalsByUserStub.resolves([
      { id: 'rental-uuid1', userId: req.user.id, carId: 'car-uuid1', startDate: 'date1', expectedEndDate: 'date2' },
      { id: 'rental-uuid2', userId: req.user.id, carId: 'car-uuid2', startDate: 'date3', expectedEndDate: 'date4' },
    ]);

    await rentalController.getRentalsByUser(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([
      { id: 'rental-uuid1', userId: req.user.id, carId: 'car-uuid1', startDate: 'date1', expectedEndDate: 'date2' },
      { id: 'rental-uuid2', userId: req.user.id, carId: 'car-uuid2', startDate: 'date3', expectedEndDate: 'date4' },
    ])).to.be.true;
  });

  it('TC005 - Deve exibir a mensagem quando o usuario não tem carros alugados', async () => {
    const req = { user: { id: 'user-without-rentals' } }; // Mocking req.user.id
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    getRentalsByUserStub.resolves([]);

    await rentalController.getRentalsByUser(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ error: messages.RENTALS_NOT_FOUND })).to.be.true;
  });
});