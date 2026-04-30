'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('hospitals').catch(() => null);
    if (tableInfo && !tableInfo.deletedAt) {
      await queryInterface.addColumn('hospitals', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('hospitals', 'deletedAt');
  }
};
