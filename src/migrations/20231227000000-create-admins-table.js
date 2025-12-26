'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admins table
    await queryInterface.createTable('admins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create status enum if it doesn't exist (for admins)
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_admins_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admins');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admins_status"');
  }
};

