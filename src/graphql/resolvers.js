const { ApolloError } = require('apollo-server-express');
const userService = require('../service/userService');
const carService = require('../service/carService');
const rentalService = require('../service/rentalService');

const resolvers = {
  Query: {
    users: async () => {
      try {
        return await userService.getAllUsers();
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
    user: async (parent, { id }) => {
      try {
        return await userService.getUserById(id);
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
    cars: async () => {
      try {
        return await carService.getAvailableCars();
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
    car: async (parent, { id }) => {
      try {
        return await carService.getCarById(id);
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
    rentals: async () => {
      try {
        return await rentalService.getAllRentals();
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
    rental: async (parent, { id }) => {
      try {
        return await rentalService.getRentalById(id);
      } catch (error) {
        throw new ApolloError(error.message, 'QUERY_ERROR');
      }
    },
  },
  Mutation: {
    registerUser: async (parent, { name, email, cpf, password }) => {
      try {
        const user = await userService.registerUser(name, email, cpf, password);
        return { user, message: 'User registered successfully' };
      } catch (error) {
        throw new ApolloError(error.message, 'REGISTRATION_ERROR');
      }
    },
    loginUser: async (parent, { email, password }) => {
      try {
        const { token, user } = await userService.loginUser(email, password);
        return { token, user, message: 'Login successful' };
      } catch (error) {
        throw new ApolloError(error.message, 'AUTHENTICATION_ERROR');
      }
    },
    registerCar: async (parent, { brand, model, year, plate, dailyRate }) => {
      try {
        const car = await carService.registerCar(brand, model, year, plate, dailyRate);
        return { car, message: 'Car registered successfully' };
      } catch (error) {
        throw new ApolloError(error.message, 'CAR_REGISTRATION_ERROR');
      }
    },
    createRental: async (parent, { carId, startDate, expectedEndDate }, context) => {
      try {
        if (!context.user || !context.user.id) {
          throw new ApolloError('Authentication required: User not logged in.', 'UNAUTHENTICATED');
        }
        const userId = context.user.id;
        const rental = await rentalService.createRental(userId, carId, startDate, expectedEndDate);
        return { rental, message: 'Rental registered successfully' };
      } catch (error) {
        throw new ApolloError(error.message, 'RENTAL_CREATION_ERROR');
      }
    },
  },
};

module.exports = resolvers;