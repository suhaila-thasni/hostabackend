'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = [
      ['emergencyContact', { type: Sequelize.STRING, allowNull: true }],
      ['latitude',         { type: Sequelize.DOUBLE, allowNull: true }],
      ['longitude',        { type: Sequelize.DOUBLE, allowNull: true }],
      ['about',            { type: Sequelize.TEXT, allowNull: true }],
      ['working_hours_general',        { type: Sequelize.JSONB, allowNull: true }],
      ['working_hours_clinic',         { type: Sequelize.JSONB, allowNull: true }],
      ['working_hours_clinic_nobreak', { type: Sequelize.JSONB, allowNull: true }],
      ['web',              { type: Sequelize.STRING, allowNull: true }],
      ['roleId',           { type: Sequelize.INTEGER, defaultValue: 2, allowNull: true }],
      ['deleteRequested',  { type: Sequelize.BOOLEAN, defaultValue: false }],
      ['deleteDate',       { type: Sequelize.DATE, allowNull: true }],
      ['otp',              { type: Sequelize.STRING, allowNull: true }],
      ['otpExpiry',        { type: Sequelize.DATE, allowNull: true }],
    ];

    for (const [colName, colDef] of columns) {
      try {
        await queryInterface.addColumn('hospitals', colName, colDef);
        console.log(`  ✅ Added column: ${colName}`);
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          console.log(`  ⏭️  Column already exists: ${colName}`);
        } else {
          throw err;
        }
      }
    }
  },

  async down(queryInterface) {
    const columns = [
      'emergencyContact', 'latitude', 'longitude', 'about',
      'working_hours_general', 'working_hours_clinic', 'working_hours_clinic_nobreak',
      'web', 'roleId', 'deleteRequested', 'deleteDate', 'otp', 'otpExpiry',
    ];

    for (const colName of columns) {
      try {
        await queryInterface.removeColumn('hospitals', colName);
      } catch (err) {
        // ignore if column doesn't exist
      }
    }
  },
};
