'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('rfid_devices', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hospitals', // Make sure this matches the table name for hospitals
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      deviceName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      locationImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      deviceType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      secretKey: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("Active", "Inactive"),
        allowNull: false,
        defaultValue: "Active"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('rfid_devices');
  }
};
