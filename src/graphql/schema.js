const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    cpf: String!
  }

  type Car {
    id: ID!
    brand: String!
    model: String!
    year: Int!
    plate: String!
    dailyRate: Float!
    isAvailable: Boolean!
  }

  type Rental {
    id: ID!
    userId: ID!
    carId: ID!
    startDate: String!
    expectedEndDate: String!
    actualEndDate: String
    totalCost: Float
  }

  type Query {
    users: [User]
    user(id: ID!): User
    cars: [Car]
    car(id: ID!): Car
    rentals: [Rental]
    rental(id: ID!): Rental
  }

  type AuthPayload {
    token: String!
    user: User!
    message: String
  }

  type UserPayload {
    user: User!
    message: String
  }

  type CarPayload {
    car: Car!
    message: String
  }

  type RentalPayload {
    rental: Rental!
    message: String
  }

  type Mutation {
    registerUser(name: String!, email: String!, cpf: String!, password: String!): UserPayload
    loginUser(email: String!, password: String!): AuthPayload
    registerCar(brand: String!, model: String!, year: Int!, plate: String!, dailyRate: Float!): CarPayload
    createRental(carId: ID!, startDate: String!, expectedEndDate: String!): RentalPayload
  }
`;

module.exports = typeDefs;