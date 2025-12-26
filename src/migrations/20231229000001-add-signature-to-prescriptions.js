'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prescriptions', 'doctor_signature', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Base64 encoded signature image or signature data',
    });

    await queryInterface.addColumn('prescriptions', 'doctor_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('prescriptions', 'doctor_license', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('prescriptions', 'template_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Reference to prescription template if used',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('prescriptions', 'doctor_signature');
    await queryInterface.removeColumn('prescriptions', 'doctor_name');
    await queryInterface.removeColumn('prescriptions', 'doctor_license');
    await queryInterface.removeColumn('prescriptions', 'template_id');
  },
};
