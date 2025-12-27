const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      adminId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'admin_id',
        references: {
          model: 'admins',
          key: 'id',
        },
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'clinic_id',
        references: {
          model: 'clinics',
          key: 'id',
        },
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'entity_type',
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'entity_id',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
    },
    {
      tableName: 'activity_logs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['admin_id'] },
        { fields: ['clinic_id'] },
        { fields: ['action'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
      ],
    },
  );

  return ActivityLog;
};

