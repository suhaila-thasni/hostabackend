"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("attendances");

    if (!tableInfo.name) {
      await queryInterface.addColumn("attendances", "name", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.attendanceType) {
      await queryInterface.addColumn("attendances", "attendanceType", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.date) {
      await queryInterface.addColumn("attendances", "date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!tableInfo.checkInTime) {
      await queryInterface.addColumn("attendances", "checkInTime", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.checkOutTime) {
      await queryInterface.addColumn("attendances", "checkOutTime", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Change type to allowNull true for legacy support
    await queryInterface.changeColumn("attendances", "type", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("attendances", "name");
    await queryInterface.removeColumn("attendances", "attendanceType");
    await queryInterface.removeColumn("attendances", "date");
    await queryInterface.removeColumn("attendances", "checkInTime");
    await queryInterface.removeColumn("attendances", "checkOutTime");
    
    await queryInterface.changeColumn("attendances", "type", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
