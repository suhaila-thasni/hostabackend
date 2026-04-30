'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 🔹 Remove email column
    await queryInterface.removeColumn('ambulances', 'email');

    // 🔹 Remove password column
    await queryInterface.removeColumn('ambulances', 'password');

  },

  async down(queryInterface, Sequelize) {

    // 🔹 Add email column back
    await queryInterface.addColumn('ambulances', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 🔹 Add password column back
    await queryInterface.addColumn('ambulances', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

  }
};