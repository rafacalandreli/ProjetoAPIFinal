const { expect } = require('chai');
const sinon = require('sinon');
const carController = require('../../src/controller/carController');
const carService = require('../../src/service/carService');
const messages = require('../../src/config/messages');

describe('US 002 - Car Validations', () => {
  let registerCarStub;
  let getAvailableCarsStub;

  beforeEach(() => {
    registerCarStub = sinon.stub(carService, 'registerCar');
    getAvailableCarsStub = sinon.stub(carService, 'getAvailableCars');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('TC 001 - Cadastrar um novo carro com sucesso', async () => {
    const req = {
      body: {
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: 'XYZ-5678',
        dailyRate: 80.00,
      },
    };
    
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    registerCarStub.resolves({
      id: 'some-uuid',
      brand: 'Ford',
      model: 'Ka',
      year: 2021,
      plate: 'XYZ-5678',
      dailyRate: 80.00,
      isAvailable: true,
    });

    await carController.registerCar(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith({
      message: messages.CAR_REGISTERED_SUCCESS,
      car: {
        id: 'some-uuid',
        brand: 'Ford',
        model: 'Ka',
        year: 2021,
        plate: 'XYZ-5678',
        dailyRate: 80.00,
        isAvailable: true,
      },
    })).to.be.true;
  });

  it('TC 002 - Não pode cadastrar novamente o mesmo carro', async () => {
    const req = {
      body: {
        brand: 'Fiat',
        model: 'Uno',
        year: 2020,
        plate: 'ABC-1234',
        dailyRate: 70.00,
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    registerCarStub.throws(new Error(messages.PLATE_ALREADY_REGISTERED));

    await carController.registerCar(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ error: messages.PLATE_ALREADY_REGISTERED })).to.be.true;
  });

  it('TC 003 - Visualizar todos os carros cadastrados', async () => {
    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    getAvailableCarsStub.resolves([
      { id: 'uuid1', brand: 'Toyota', model: 'Corolla', plate: 'COR-1234', isAvailable: true },
      { id: 'uuid2', brand: 'Honda', model: 'Civic', plate: 'HON-5678', isAvailable: true },
    ]);

    await carController.getAvailableCars(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([
      { id: 'uuid1', brand: 'Toyota', model: 'Corolla', plate: 'COR-1234', isAvailable: true },
      { id: 'uuid2', brand: 'Honda', model: 'Civic', plate: 'HON-5678', isAvailable: true },
    ])).to.be.true;
  });
});