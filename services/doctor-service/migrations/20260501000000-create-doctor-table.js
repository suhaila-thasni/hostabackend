'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the main 'doctor' table
    await queryInterface.createTable('doctor', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      doctorNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      hospitalName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      specialist: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      qualification: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      regNo: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      autoDecline: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      appointmentCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      fcmToken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      experience: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      fees: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      dob: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      knowLanguages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      address: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      consultingTwo: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      consultingOne: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      outDoorConsulting: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      bookingOpen: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      joiningDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      todayBookingAcceptCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },

      roleId: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING',
        allowNull: false,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      isDelete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      deleteDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      otp: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      otpExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      accessCardUid: {
        type: Sequelize.STRING,
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
    });

    // Add indexes matching the model
    await queryInterface.addIndex('doctor', ['hospitalId', 'doctorNumber'], { unique: true });
    await queryInterface.addIndex('doctor', ['hospitalId', 'phone'], { unique: true });
    await queryInterface.addIndex('doctor', ['hospitalId', 'email'], { unique: true });
    await queryInterface.addIndex('doctor', ['hospitalId', 'accessCardUid'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('doctor');
  },
};
