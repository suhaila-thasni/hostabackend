module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospitals", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true },
      phone: { type: Sequelize.STRING, unique: true },
      address: { type: Sequelize.JSONB },
      type: { type: Sequelize.STRING }, // e.g. Private, Government
      emergencyContact: { type: Sequelize.STRING },
      latitude: { type: Sequelize.DOUBLE },
      longitude: { type: Sequelize.DOUBLE },
      about: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("hospitals");
  },
};
