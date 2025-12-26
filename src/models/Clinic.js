const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Clinic = sequelize.define(
    'Clinic',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      plan: {
        type: DataTypes.ENUM('FREE', 'STARTER', 'CLINIC', 'PRO'),
        defaultValue: 'FREE',
      },
      subscriptionStatus: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'TRIAL', 'EXPIRED'),
        defaultValue: 'TRIAL',
        field: 'subscription_status',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailNotificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'email_notifications_enabled',
      },
      smsNotificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'sms_notifications_enabled',
      },
      appointmentReminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'appointment_reminders',
      },
      visitReminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'visit_reminders',
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'registration_number',
      },
      taxId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'tax_id',
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'logo_url',
      },
    },
    {
      tableName: 'clinics',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Clinic;
};
