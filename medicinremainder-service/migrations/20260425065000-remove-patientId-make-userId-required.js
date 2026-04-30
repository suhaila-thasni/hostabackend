'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Drop patientId column — no longer needed
    const tableDescription = await queryInterface.describeTable('medicine_schedules');
    if (tableDescription['patientId']) {
      await queryInterface.removeColumn('medicine_schedules', 'patientId');
    }

    // 2. Set userId = 0 for any existing rows where it is NULL
    //    (These are legacy rows created before userId was tracked)
    await queryInterface.sequelize.query(
      `UPDATE medicine_schedules SET "userId" = 0 WHERE "userId" IS NULL`
    );

    // 3. Now safely make userId NOT NULL
    await queryInterface.changeColumn('medicine_schedules', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore patientId
    const tableDescription = await queryInterface.describeTable('medicine_schedules');
    if (!tableDescription['patientId']) {
      await queryInterface.addColumn('medicine_schedules', 'patientId', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Revert userId to nullable
    await queryInterface.changeColumn('medicine_schedules', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
