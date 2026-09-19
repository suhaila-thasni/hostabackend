'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Replace the status ENUM with the new values
    //    PostgreSQL requires dropping and recreating the ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_rfid_devices_status" ADD VALUE IF NOT EXISTS 'Disabled';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_rfid_devices_status" ADD VALUE IF NOT EXISTS 'Unregistered';
    `);

    // 2. Add unregisteredAt column
    await queryInterface.addColumn('rfid_devices', 'unregisteredAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unregisteredAt column
    await queryInterface.removeColumn('rfid_devices', 'unregisteredAt');

    // Note: Removing values from a PostgreSQL ENUM is complex.
    // In a real rollback you would need to recreate the type.
    // For safety, we leave the ENUM values in place on rollback.
  }
};
