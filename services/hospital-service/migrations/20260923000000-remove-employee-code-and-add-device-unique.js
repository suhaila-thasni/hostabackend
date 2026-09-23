"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the employeeCode column
    await queryInterface.removeColumn("fingerprint_enrollments", "employeeCode");

    // Add unique constraint to prevent duplicate enrollment of same employee to same device
    await queryInterface.addIndex("fingerprint_enrollments", ["hospitalId", "employeeId", "employeeType", "deviceId"], {
      unique: true,
      name: "fingerprint_enrollments_employee_device_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    // Add back the employeeCode column
    await queryInterface.addColumn("fingerprint_enrollments", "employeeCode", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Remove the unique constraint
    await queryInterface.removeIndex("fingerprint_enrollments", "fingerprint_enrollments_employee_device_unique");
  },
};
