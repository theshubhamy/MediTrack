const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Clinic = sequelize.define('Clinic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    plan: {
      type: DataTypes.ENUM('FREE', 'STARTER', 'CLINIC', 'PRO'),
      defaultValue: 'FREE'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'TRIAL', 'EXPIRED'),
      defaultValue: 'TRIAL',
      field: 'subscription_status'
    }
  }, {
    tableName: 'clinics',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Clinic;
};

