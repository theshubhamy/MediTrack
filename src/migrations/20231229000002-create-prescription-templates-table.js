'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescription_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      clinic_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clinics',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      medicines: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '[]',
        comment: 'Array of medicine objects with default dosages',
      },
      advice: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_default',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
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
    await queryInterface.addIndex('prescription_templates', ['clinic_id']);
    await queryInterface.addIndex('prescription_templates', ['is_default']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('prescription_templates');
  },
};
