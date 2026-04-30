'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ambulances', 'otp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('ambulances', 'otpExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ambulances', 'otp');
    await queryInterface.removeColumn('ambulances', 'otpExpiry');
  }
};
