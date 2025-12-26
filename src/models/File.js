const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'visit_id',
      references: {
        model: 'visits',
        key: 'id'
      }
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_url'
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_type'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name'
    }
  }, {
    tableName: 'files',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return File;
};

