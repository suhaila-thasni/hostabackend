"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("booking");

    if (tableInfo.patientId && !tableInfo.userId) {
      await queryInterface.renameColumn("booking", "patientId", "userId");
    } else if (!tableInfo.userId) {
      // If patientId doesn't exist either, create userId from scratch
      await queryInterface.addColumn("booking", "userId", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("booking", "userId", "patientId");
  },
};
