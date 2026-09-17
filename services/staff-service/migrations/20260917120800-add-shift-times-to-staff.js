"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("staff", "shiftStartTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn("staff", "shiftEndTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("staff", "shiftStartTime");
    await queryInterface.removeColumn("staff", "shiftEndTime");
  },
};
