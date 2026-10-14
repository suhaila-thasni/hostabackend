'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('doctor', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PENDING',
      });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log('  ⏭️  Column "status" already exists, skipping');
      } else {
        throw err;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctor', 'status');
  }
};
