"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable("doctor");
      if (!tableInfo.deletedAt) {
        await queryInterface.addColumn("doctor", "deletedAt", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    } catch (error) {
      // If table doesn't exist or other error, let's try to add it anyway or log it
      console.error("Error in ensure-deleted-at migration:", error);
      // Try to add it directly if describe failed
      try {
         await queryInterface.addColumn("doctor", "deletedAt", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      } catch (innerError) {
        console.log("deletedAt already exists or table missing");
      }
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn("doctor", "deletedAt");
    } catch (e) {}
  },
};
