'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for appointment status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_appointments_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      clinic_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clinics',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      appointment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      appointment_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      status: {
        type: Sequelize.ENUM('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
        defaultValue: 'SCHEDULED',
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reminder_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      reminder_sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Create indexes for better query performance
    await queryInterface.addIndex('appointments', ['clinic_id']);
    await queryInterface.addIndex('appointments', ['patient_id']);
    await queryInterface.addIndex('appointments', ['doctor_id']);
    await queryInterface.addIndex('appointments', ['appointment_date']);
    await queryInterface.addIndex('appointments', ['status']);
    await queryInterface.addIndex('appointments', ['appointment_date', 'appointment_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('appointments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_status"');
  },
};

