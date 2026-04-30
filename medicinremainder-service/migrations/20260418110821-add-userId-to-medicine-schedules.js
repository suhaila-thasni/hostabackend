'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('medicine_schedules', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Must be nullable for existing rows that have no userId yet
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicine_schedules', 'userId');
  }
};
