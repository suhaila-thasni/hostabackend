'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = [
      ['bookingId', { type: Sequelize.INTEGER, allowNull: true }],
      ['metadata',  { type: Sequelize.JSONB, allowNull: true, defaultValue: null }],
    ];

    for (const [colName, colDef] of columns) {
      try {
        await queryInterface.addColumn('notifications', colName, colDef);
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
    await queryInterface.removeColumn('notifications', 'bookingId');
    await queryInterface.removeColumn('notifications', 'metadata');
  },
};
