"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable("doctor_hospitals", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        doctorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        hospitalId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "ACTIVE",
        },
        joinedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        leftAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      // Add unique constraint on (doctorId, hospitalId)
      await queryInterface.addConstraint("doctor_hospitals", {
        fields: ["doctorId", "hospitalId"],
        type: "unique",
        name: "uniq_doctor_hospital",
      });
    } catch (err) {
      console.error("doctor_hospitals migration error:", err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint(
        "doctor_hospitals",
        "uniq_doctor_hospital",
      );
    } catch (e) {
      // ignore
    }
    await queryInterface.dropTable("doctor_hospitals");
  },
};
