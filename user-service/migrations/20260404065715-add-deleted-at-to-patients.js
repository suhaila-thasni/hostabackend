'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('patients');
    if (!tableInfo.deletedAt) {
      await queryInterface.addColumn('patients', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('patients');
    if (tableInfo.deletedAt) {
      await queryInterface.removeColumn('patients', 'deletedAt');
    }
  }
};
