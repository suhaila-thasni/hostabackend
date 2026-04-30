'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('patients').catch(() => null);
    if (tableInfo && !tableInfo.deletedAt) {
      await queryInterface.addColumn('patients', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'deletedAt');
  }
};
