'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('doctor').catch(() => null);
    if (tableInfo && !tableInfo.deletedAt) {
      await queryInterface.addColumn('doctor', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctor', 'deletedAt');
  }
};
