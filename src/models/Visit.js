const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Visit = sequelize.define(
    'Visit',
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
      symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nextVisitDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'next_visit_date',
      },
    },
    {
      tableName: 'visits',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Visit;
};
