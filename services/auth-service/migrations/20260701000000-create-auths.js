module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('auths', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      superadminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hospitalName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      doctorName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      staffName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      doctor_fcmtoken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
      },
      staff_fcmtoken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
      },
      hospital_fcmtoken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
      },
      superadmin_fcmtoken: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
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
      notificationEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auths');
  },
};
