'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('rfid_devices', 'devices');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('devices', 'rfid_devices');
  }
};

