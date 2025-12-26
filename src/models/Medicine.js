const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Medicine = sequelize.define(
    'Medicine',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'clinic_id',
        references: {
          model: 'clinics',
          key: 'id',
        },
        comment: 'null = global medicine, otherwise clinic-specific',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genericName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'generic_name',
      },
      brandName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'brand_name',
      },
      type: {
        type: DataTypes.ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'OINTMENT', 'OTHER'),
        allowNull: false,
        defaultValue: 'TABLET',
      },
      strength: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g., "500mg", "10ml"',
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'mg',
        comment: 'Default unit for dosage calculation',
      },
      dosageForm: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'dosage_form',
        comment: 'e.g., "Oral", "Topical", "IV"',
      },
      frequency: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Common frequency, e.g., "Once daily", "Twice daily"',
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Common duration, e.g., "5 days", "1 week"',
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Common instructions',
      },
      sideEffects: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'side_effects',
      },
      contraindications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'medicines',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Medicine;
};

