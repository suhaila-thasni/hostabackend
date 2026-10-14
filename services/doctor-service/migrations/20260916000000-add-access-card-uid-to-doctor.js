'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('doctor', 'accessCardUid', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log('  ⏭️  Column "accessCardUid" already exists, skipping');
      } else {
        throw err;
      }
    }
    
    try {
      await queryInterface.addIndex('doctor', ['hospitalId', 'accessCardUid'], {
        unique: true,
        name: 'doctor_hospital_access_card_unique'
      });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log('  ⏭️  Index already exists, skipping');
      } else {
        throw err;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('doctor', 'doctor_hospital_access_card_unique');
    await queryInterface.removeColumn('doctor', 'accessCardUid');
  }
};
