'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employeeType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Staff',
      },
      employeeName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      employeeEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      leaveType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      totalDays: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1,
      },
      reasonCategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      additionalDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handoverToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      handoverToName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      handoverToType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      handoverNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isConfirmed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending',
      },
      adminComments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      actionBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      actionByName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      actionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      appliedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for fast queries
    await queryInterface.addIndex('leave_requests', ['hospitalId']);
    await queryInterface.addIndex('leave_requests', ['employeeId']);
    await queryInterface.addIndex('leave_requests', ['status']);
    await queryInterface.addIndex('leave_requests', ['hospitalId', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leave_requests');
  },
};
