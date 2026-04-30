'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('doctor', 'otp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('doctor', 'otpExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('doctor', 'otp');
    await queryInterface.removeColumn('doctor', 'otpExpiry');
  }
};
