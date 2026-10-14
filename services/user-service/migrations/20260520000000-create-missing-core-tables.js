
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create patients first because other tables depend on it.
    await queryInterface.createTable("patients", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bloodGroup: {
        type: Sequelize.ENUM(
          "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"
        ),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM("Male", "Female", "Other"),
        allowNull: false,
      },
      maritalStatus: {
        type: Sequelize.ENUM(
          "Single", "Married", "Divorced", "Widowed"
        ),
        allowNull: true,
      },
      patientType: {
        type: Sequelize.ENUM("Inpatient", "Outpatient"),
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      mobileNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emergencyNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      guardianName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      addressLine: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDelete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleteDate: {
        type: Sequelize.DATE,
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
    });

    // 2. Create prescriptions.
    await queryInterface.createTable("prescriptions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      prescriptionNumber: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      prescribedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      complaint: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      medications: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      investigations: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      advice: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      next_consultation: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      empty_stomach: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleteDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDelete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canvasBg: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hospitalName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      patientName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      design: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
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
    });

    // 3. Create patient_vitals after prescriptions.
    await queryInterface.createTable("patient_vitals", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "patients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      prescriptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "prescriptions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      temperature: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      pulse: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      respiratoryRate: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      spo2: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      height: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      bmi: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      waist: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      bsa: {
        type: Sequelize.FLOAT,
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("patient_vitals");
    await queryInterface.dropTable("prescriptions");
    await queryInterface.dropTable("patients");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_patients_bloodGroup";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_patients_gender";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_patients_maritalStatus";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_patients_patientType";'
    );
  },
};