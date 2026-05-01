"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("prescriptions", "roleId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("prescriptions", "roleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};