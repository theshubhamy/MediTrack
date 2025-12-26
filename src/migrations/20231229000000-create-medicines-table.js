'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for medicine type
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_medicines_type" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'OINTMENT', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('medicines', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      clinic_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'clinics',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'null = global medicine, otherwise clinic-specific',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      generic_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      brand_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM(
          'TABLET',
          'CAPSULE',
          'SYRUP',
          'INJECTION',
          'DROPS',
          'OINTMENT',
          'OTHER',
        ),
        allowNull: false,
        defaultValue: 'TABLET',
      },
      strength: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'e.g., "500mg", "10ml"',
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'mg',
        comment: 'Default unit for dosage calculation',
      },
      dosage_form: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'e.g., "Oral", "Topical", "IV"',
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Common frequency, e.g., "Once daily", "Twice daily"',
      },
      duration: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Common duration, e.g., "5 days", "1 week"',
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Common instructions',
      },
      side_effects: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contraindications: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('medicines', ['clinic_id']);
    await queryInterface.addIndex('medicines', ['name']);
    await queryInterface.addIndex('medicines', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('medicines');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_medicines_type"',
    );
  },
};
