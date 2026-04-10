'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('doctor', 'joiningDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('doctor', 'todayBookingAcceptCount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('doctor', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('doctor', 'isDelete', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('doctor', 'joiningDate');
    await queryInterface.removeColumn('doctor', 'todayBookingAcceptCount');
    await queryInterface.removeColumn('doctor', 'isActive');
    await queryInterface.removeColumn('doctor', 'isDelete');
  }

};
