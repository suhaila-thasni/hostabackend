"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove roleId from report table
    await queryInterface.removeColumn("report", "roleId");

    // Remove roleId from test table
    await queryInterface.removeColumn("test", "roleId");
  },

  async down(queryInterface, Sequelize) {
    // Add back roleId (rollback)
    await queryInterface.addColumn("report", "roleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("test", "roleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};