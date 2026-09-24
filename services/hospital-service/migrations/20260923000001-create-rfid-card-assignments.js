"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfid_card_assignments", {
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
      cardNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("Active", "Inactive"),
        allowNull: false,
        defaultValue: "Active",
      },
      assignedAt: {
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

    await queryInterface.addIndex("rfid_card_assignments", ["hospitalId", "employeeId", "employeeType"], {
      unique: true,
      name: "rfid_card_assignments_employee_unique",
    });
    await queryInterface.addIndex("rfid_card_assignments", ["hospitalId", "cardNumber"], {
      unique: true,
      name: "rfid_card_assignments_card_unique",
    });
    await queryInterface.addIndex("rfid_card_assignments", ["hospitalId", "status"], {
      name: "rfid_card_assignments_hospital_status_idx",
    });
    await queryInterface.addIndex("rfid_card_assignments", ["deviceId"], {
      name: "rfid_card_assignments_device_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfid_card_assignments");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rfid_card_assignments_employeeType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rfid_card_assignments_status";');
  },
};
