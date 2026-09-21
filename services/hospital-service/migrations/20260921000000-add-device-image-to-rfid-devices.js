'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rfid_devices', 'deviceImage', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'locationImage', // Places it after locationImage column (MySQL only)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfid_devices', 'deviceImage');
  },
};
