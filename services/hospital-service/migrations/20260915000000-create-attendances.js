"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("attendances", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      employeeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "References roleId assigned by the hospital",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      selfie_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      roles: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      duration: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      creator_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      editor_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      editor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("attendances");
  },
};
