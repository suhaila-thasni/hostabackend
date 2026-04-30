'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.otp) {
      await queryInterface.addColumn('users', 'otp', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.otpExpiry) {
      await queryInterface.addColumn('users', 'otpExpiry', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'otp');
    await queryInterface.removeColumn('users', 'otpExpiry');
  }
};