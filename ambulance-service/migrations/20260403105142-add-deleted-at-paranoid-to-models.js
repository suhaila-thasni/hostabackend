'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('ambulances', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    } catch (e) { console.log('Column deletedAt already exists in ambulances'); }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ambulances', 'deletedAt');
  }
};
