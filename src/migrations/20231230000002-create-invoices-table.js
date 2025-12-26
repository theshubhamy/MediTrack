'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for invoice status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_invoices_status" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('invoices', {
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
      invoice_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      plan: {
        type: Sequelize.ENUM('FREE', 'STARTER', 'CLINIC', 'PRO'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'tax_amount',
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_amount',
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'due_date',
      },
      paid_date: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'paid_date',
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'payment_method',
      },
      payment_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'payment_transaction_id',
      },
      billing_period_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'billing_period_start',
      },
      billing_period_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'billing_period_end',
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Create indexes
    await queryInterface.addIndex('invoices', ['clinic_id']);
    await queryInterface.addIndex('invoices', ['invoice_number']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['due_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_status"');
  },
};

