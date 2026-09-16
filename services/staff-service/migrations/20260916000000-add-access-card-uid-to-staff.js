'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('staff', 'accessCardUid', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addIndex('staff', ['hospitalId', 'accessCardUid'], {
      unique: true,
      name: 'staff_hospital_access_card_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('staff', 'staff_hospital_access_card_unique');
    await queryInterface.removeColumn('staff', 'accessCardUid');
  }
};
