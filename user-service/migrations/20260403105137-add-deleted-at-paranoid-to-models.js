'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('users', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    } catch (e) { console.log('Column deletedAt already exists in users'); }
    
    try {
      await queryInterface.addColumn('patients', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    } catch (e) { console.log('Column deletedAt already exists in patients'); }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'deletedAt');
    await queryInterface.removeColumn('patients', 'deletedAt');
  }
};
