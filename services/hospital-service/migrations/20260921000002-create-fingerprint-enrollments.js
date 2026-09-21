"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fingerprint_enrollments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "hospitals", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      employeeType: {
        type: Sequelize.ENUM("Doctor", "Staff"),
        allowNull: false,
      },
      employeeName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      employeeCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deviceId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      deviceDbId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "rfid_devices", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      fingerPosition: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "right-thumb",
      },
      fingerprintHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      templateReference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quality: {
        type: Sequelize.ENUM("Poor", "Fair", "Good", "Excellent"),
        allowNull: false,
        defaultValue: "Good",
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: Sequelize.ENUM("Active", "Inactive"),
        allowNull: false,
        defaultValue: "Active",
      },
      enrolledAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("fingerprint_enrollments", ["hospitalId", "employeeId", "employeeType", "fingerPosition"], {
      unique: true,
      name: "fingerprint_enrollments_employee_finger_unique",
    });
    await queryInterface.addIndex("fingerprint_enrollments", ["hospitalId", "fingerprintHash"], {
      unique: true,
      name: "fingerprint_enrollments_hash_unique",
    });
    await queryInterface.addIndex("fingerprint_enrollments", ["hospitalId", "status"], {
      name: "fingerprint_enrollments_hospital_status_idx",
    });
    await queryInterface.addIndex("fingerprint_enrollments", ["deviceId"], {
      name: "fingerprint_enrollments_device_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fingerprint_enrollments");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fingerprint_enrollments_employeeType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fingerprint_enrollments_quality";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fingerprint_enrollments_status";');
  },
};
