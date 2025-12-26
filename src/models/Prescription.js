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
