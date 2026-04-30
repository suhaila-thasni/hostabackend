'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create 'review' table
    await queryInterface.createTable('review', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });

    // Create 'ratings' table
    await queryInterface.createTable('ratings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for ratings
    await queryInterface.addIndex('ratings', ['userId', 'doctorId'], {
      unique: true,
      name: 'ratings_userId_doctorId_unique'
    });
    await queryInterface.addIndex('ratings', ['userId', 'hospitalId'], {
      unique: true,
      name: 'ratings_userId_hospitalId_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ratings');
    await queryInterface.dropTable('review');
  }
};
