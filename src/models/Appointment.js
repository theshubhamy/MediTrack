const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Appointment = sequelize.define(
    'Appointment',
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
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'patient_id',
        references: {
          model: 'patients',
          key: 'id',
        },
      },
      doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'doctor_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'appointment_date',
      },
      appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'appointment_time',
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30, // minutes
      },
      status: {
        type: DataTypes.ENUM('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
        defaultValue: 'SCHEDULED',
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reminderSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'reminder_sent',
      },
      reminderSentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reminder_sent_at',
      },
    },
    {
      tableName: 'appointments',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Appointment;
};

