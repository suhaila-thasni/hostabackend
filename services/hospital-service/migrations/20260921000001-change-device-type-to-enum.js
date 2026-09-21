"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change deviceType from STRING to ENUM('face', 'rfid', 'fingerprint')
    await queryInterface.sequelize.query(`
      UPDATE "rfid_devices"
      SET "deviceType" = LOWER("deviceType")
      WHERE LOWER("deviceType") IN ('face', 'rfid', 'fingerprint');
    `);

    await queryInterface.changeColumn("rfid_devices", "deviceType", {
      type: Sequelize.ENUM("face", "rfid", "fingerprint"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to STRING
    await queryInterface.changeColumn("rfid_devices", "deviceType", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
