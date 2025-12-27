const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const User = sequelize.define(
    'User',
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
      },
      role: {
        type: DataTypes.ENUM('CLINIC_ADMIN', 'DOCTOR', 'STAFF'),
        defaultValue: 'STAFF',
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
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
      preferredLanguage: {
        type: DataTypes.STRING,
        defaultValue: 'en',
        field: 'preferred_language',
      },
      timezone: {
        type: DataTypes.STRING,
        defaultValue: 'UTC',
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return User;
};
