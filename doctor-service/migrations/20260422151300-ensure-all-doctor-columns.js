"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("doctor").catch(() => ({}));

    const columnsToAdd = [
      { name: "otp", type: Sequelize.STRING },
      { name: "otpExpiry", type: Sequelize.DATE },
      { name: "hospitalId", type: Sequelize.INTEGER },
      { name: "deletedAt", type: Sequelize.DATE },
    ];

    for (const column of columnsToAdd) {
      if (!tableInfo[column.name]) {
        console.log(`Adding missing column: ${column.name}`);
        await queryInterface.addColumn("doctor", column.name, {
          type: column.type,
          allowNull: true,
        }).catch(err => console.error(`Error adding ${column.name}:`, err.message));
      }
    }
  },

  async down(queryInterface) {
    // No down action for "ensure" migration
  },
};
