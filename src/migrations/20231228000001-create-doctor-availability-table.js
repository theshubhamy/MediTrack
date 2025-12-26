'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('doctor_availability', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      slot_duration: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        comment: 'Duration in minutes',
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
    await queryInterface.addIndex('doctor_availability', ['doctor_id']);
    await queryInterface.addIndex('doctor_availability', ['day_of_week']);
    await queryInterface.addIndex('doctor_availability', ['doctor_id', 'day_of_week']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('doctor_availability');
  },
};

