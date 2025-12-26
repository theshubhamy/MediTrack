'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add email settings
    await queryInterface.addColumn('clinics', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('clinics', 'email_notifications_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('clinics', 'sms_notifications_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('clinics', 'appointment_reminders', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('clinics', 'visit_reminders', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    // Add clinic details
    await queryInterface.addColumn('clinics', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('clinics', 'registration_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('clinics', 'tax_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('clinics', 'logo_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clinics', 'email');
    await queryInterface.removeColumn('clinics', 'email_notifications_enabled');
    await queryInterface.removeColumn('clinics', 'sms_notifications_enabled');
    await queryInterface.removeColumn('clinics', 'appointment_reminders');
    await queryInterface.removeColumn('clinics', 'visit_reminders');
    await queryInterface.removeColumn('clinics', 'website');
    await queryInterface.removeColumn('clinics', 'registration_number');
    await queryInterface.removeColumn('clinics', 'tax_id');
    await queryInterface.removeColumn('clinics', 'logo_url');
  },
};

