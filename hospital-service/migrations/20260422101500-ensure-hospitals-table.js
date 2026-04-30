'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableNames = await queryInterface.showAllTables();
    
    // 1. Check if 'hospitals' (plural lowercase) exists
    if (!tableNames.includes('hospitals')) {
      
      // 2. If 'Hospitals' (plural capitalized) exists, rename it
      if (tableNames.includes('Hospitals')) {
        await queryInterface.renameTable('Hospitals', 'hospitals');
      } 
      // 3. If 'hospital' (singular) exists, rename it
      else if (tableNames.includes('hospital')) {
        await queryInterface.renameTable('hospital', 'hospitals');
      } 
      // 4. Otherwise, create it fresh
      else {
        await queryInterface.createTable("hospitals", {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING, allowNull: false },
          email: { type: Sequelize.STRING, unique: true },
          phone: { type: Sequelize.STRING, unique: true },
          address: { type: Sequelize.JSONB },
          type: { type: Sequelize.STRING },
          emergencyContact: { type: Sequelize.STRING },
          latitude: { type: Sequelize.DOUBLE },
          longitude: { type: Sequelize.DOUBLE },
          about: { type: Sequelize.TEXT },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
          deletedAt: { type: Sequelize.DATE },
        });
      }
    }
  },

  down: async (queryInterface) => {
    // No-op for safety in dev
  },
};
