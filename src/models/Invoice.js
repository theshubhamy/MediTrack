const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Invoice = sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'clinic_id',
        references: {
          model: 'clinics',
          key: 'id',
        },
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'invoice_number',
      },
      plan: {
        type: DataTypes.ENUM('FREE', 'STARTER', 'CLINIC', 'PRO'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'tax_amount',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_amount',
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'due_date',
      },
      paidDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_date',
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'payment_method',
      },
      paymentTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'payment_transaction_id',
      },
      billingPeriodStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'billing_period_start',
      },
      billingPeriodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'billing_period_end',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'invoices',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Invoice;
};

