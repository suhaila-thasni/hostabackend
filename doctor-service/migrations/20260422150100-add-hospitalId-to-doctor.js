"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("doctor", "hospitalId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for existing records, but new ones will be validated in controller
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("doctor", "hospitalId");
  },
};
