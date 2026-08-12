"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable("staff_hospitals", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        staffId: {
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

      // Add unique constraint on (staffId, hospitalId)
      await queryInterface.addConstraint("staff_hospitals", {
        fields: ["staffId", "hospitalId"],
        type: "unique",
        name: "uniq_staff_hospital",
      });
    } catch (err) {
      console.error("staff_hospitals migration error:", err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint(
        "staff_hospitals",
        "uniq_staff_hospital",
      );
    } catch (e) {
      // ignore
    }
    await queryInterface.dropTable("staff_hospitals");
  },
};
