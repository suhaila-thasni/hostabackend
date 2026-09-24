"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("rfid_card_assignments", "employeeCode");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("rfid_card_assignments", "employeeCode", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
