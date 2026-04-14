'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      appointmentId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      complaint: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      medications: {
        type: Sequelize.JSON,
        allowNull: false
      },
      investigations: {
        type: Sequelize.JSON,
        allowNull: true
      },
      advice: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      next_consultation: {
        type: Sequelize.DATE,
        allowNull: true
      },
      empty_stomach: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexes for performance
    await queryInterface.addIndex('prescriptions', ['patientId']);
    await queryInterface.addIndex('prescriptions', ['doctorId']);
    await queryInterface.addIndex('prescriptions', ['appointmentId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('prescriptions');
  }
};
