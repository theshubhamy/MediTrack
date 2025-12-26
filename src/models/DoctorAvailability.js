const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DoctorAvailability = sequelize.define(
    'DoctorAvailability',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'day_of_week',
        comment: '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time',
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available',
      },
      slotDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        field: 'slot_duration',
        comment: 'Duration in minutes',
      },
    },
    {
      tableName: 'doctor_availability',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return DoctorAvailability;
};

