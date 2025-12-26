const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const PrescriptionTemplate = sequelize.define(
    'PrescriptionTemplate',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medicines: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of medicine objects with default dosages',
      },
      advice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_default',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'prescription_templates',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return PrescriptionTemplate;
};

