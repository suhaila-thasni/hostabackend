"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("patients", "roleId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("patients", "roleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};