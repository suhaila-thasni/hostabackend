



'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 🔹 1. Add joinAccountId (self-referencing FK)
    await queryInterface.addColumn('users', 'joinAccountId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // ✅ correct table name
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 🔹 2. Create ENUM type first (PostgreSQL safe)
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_relationType" AS ENUM ('mother', 'father', 'guardian');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 🔹 3. Add relationType column
    await queryInterface.addColumn('users', 'relationType', {
      type: Sequelize.ENUM('mother', 'father', 'guardian'),
      allowNull: true,
    });

  },

  async down(queryInterface, Sequelize) {

    // 🔹 1. Remove relationType column
    await queryInterface.removeColumn('users', 'relationType');

    // 🔹 2. Remove joinAccountId column
    await queryInterface.removeColumn('users', 'joinAccountId');

    // 🔹 3. Drop ENUM type safely
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        DROP TYPE "enum_users_relationType";
      EXCEPTION
        WHEN undefined_object THEN null;
      END $$;
    `);
  }
};