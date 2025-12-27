'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('visits', 'appointment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add index for better query performance
    await queryInterface.addIndex('visits', ['appointment_id'], {
      name: 'visits_appointment_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('visits', 'visits_appointment_id_idx');
    await queryInterface.removeColumn('visits', 'appointment_id');
  },
};

