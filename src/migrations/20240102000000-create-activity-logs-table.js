'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      clinic_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'clinics',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('activity_logs', ['user_id']);
    await queryInterface.addIndex('activity_logs', ['admin_id']);
    await queryInterface.addIndex('activity_logs', ['clinic_id']);
    await queryInterface.addIndex('activity_logs', ['action']);
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('activity_logs', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_logs');
  },
};

