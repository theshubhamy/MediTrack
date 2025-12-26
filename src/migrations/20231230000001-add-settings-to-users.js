'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_notifications_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('users', 'sms_notifications_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'appointment_reminders', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('users', 'visit_reminders', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('users', 'preferred_language', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'en',
    });

    await queryInterface.addColumn('users', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'UTC',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'email_notifications_enabled');
    await queryInterface.removeColumn('users', 'sms_notifications_enabled');
    await queryInterface.removeColumn('users', 'appointment_reminders');
    await queryInterface.removeColumn('users', 'visit_reminders');
    await queryInterface.removeColumn('users', 'preferred_language');
    await queryInterface.removeColumn('users', 'timezone');
  },
};

