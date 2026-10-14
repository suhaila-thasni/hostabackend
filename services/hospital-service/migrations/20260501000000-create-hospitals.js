'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hospitals', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      address: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      emergencyContact: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },

      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },

      about: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      working_hours_general: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      working_hours_clinic: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      working_hours_clinic_nobreak: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      web: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      roleId: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
        allowNull: true,
      },

      deleteRequested: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      deleteDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      isDelete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      otp: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      otpExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      fcmToken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING',
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },

      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hospitals');
  }
};
