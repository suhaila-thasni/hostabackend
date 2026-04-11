'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables();
    if (tableExists.includes('patient_vitals')) {
      console.log('Table "patient_vitals" already exists, skipping creation.');
      return;
    }

    await queryInterface.createTable('patient_vitals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      temperature: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      pulse: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      respiratoryRate: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      spo2: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      height: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      bmi: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      waist: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      bsa: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Index for fast lookups by patient
    await queryInterface.addIndex('patient_vitals', ['patientId'], {
      name: 'idx_patient_vitals_patient_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patient_vitals');
  }
};
