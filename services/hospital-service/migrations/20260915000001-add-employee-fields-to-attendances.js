"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("attendances");

    if (!tableInfo.employeeId) {
      await queryInterface.addColumn("attendances", "employeeId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!tableInfo.employeeType) {
      await queryInterface.addColumn("attendances", "employeeType", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("attendances", "employeeId");
    await queryInterface.removeColumn("attendances", "employeeType");
  },
};
