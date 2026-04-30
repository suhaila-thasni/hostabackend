'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hospitals', 'otp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'otpExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hospitals', 'otp');
    await queryInterface.removeColumn('hospitals', 'otpExpiry');
  }
};
