'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor', 'accessCardUid', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addIndex('doctor', ['hospitalId', 'accessCardUid'], {
      unique: true,
      name: 'doctor_hospital_access_card_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('doctor', 'doctor_hospital_access_card_unique');
    await queryInterface.removeColumn('doctor', 'accessCardUid');
  }
};
