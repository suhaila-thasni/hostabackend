"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("prescriptions");

    if (tableInfo.appointmentId && !tableInfo.bookingId) {
      await queryInterface.renameColumn("prescriptions", "appointmentId", "bookingId");
    } else if (!tableInfo.bookingId) {
      // If appointmentId doesn't exist either, create bookingId from scratch
      await queryInterface.addColumn("prescriptions", "bookingId", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("prescriptions", "bookingId", "appointmentId");
  },
};
