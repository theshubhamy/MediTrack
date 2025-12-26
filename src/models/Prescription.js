const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Prescription = sequelize.define(
    'Prescription',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      visitId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'visit_id',
        references: {
          model: 'visits',
          key: 'id',
        },
      },
      medicines: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      advice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      doctorSignature: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'doctor_signature',
        comment: 'Base64 encoded signature image or signature data',
      },
      doctorName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'doctor_name',
      },
      doctorLicense: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'doctor_license',
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'template_id',
        comment: 'Reference to prescription template if used',
      },
    },
    {
      tableName: 'prescriptions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Prescription;
};
