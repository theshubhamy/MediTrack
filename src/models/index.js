const sequelize = require('../config/database');

// Import models
const Clinic = require('./Clinic')(sequelize);
const User = require('./User')(sequelize);
const Patient = require('./Patient')(sequelize);
const Visit = require('./Visit')(sequelize);
const Prescription = require('./Prescription')(sequelize);
const File = require('./File')(sequelize);
const Admin = require('./Admin')(sequelize);
const Appointment = require('./Appointment')(sequelize);
const DoctorAvailability = require('./DoctorAvailability')(sequelize);
const Medicine = require('./Medicine')(sequelize);
const PrescriptionTemplate = require('./PrescriptionTemplate')(sequelize);
const Invoice = require('./Invoice')(sequelize);

// Define associations
Clinic.hasMany(User, {
  foreignKey: 'clinicId',
  as: 'users',
  onDelete: 'CASCADE',
});
User.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Clinic.hasMany(Patient, {
  foreignKey: 'clinicId',
  as: 'patients',
  onDelete: 'CASCADE',
});
Patient.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Clinic.hasMany(Visit, {
  foreignKey: 'clinicId',
  as: 'visits',
  onDelete: 'CASCADE',
});
Visit.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Patient.hasMany(Visit, {
  foreignKey: 'patientId',
  as: 'visits',
  onDelete: 'CASCADE',
});
Visit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Visit, {
  foreignKey: 'doctorId',
  as: 'visits',
  onDelete: 'RESTRICT',
});
Visit.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

Visit.hasOne(Prescription, {
  foreignKey: 'visitId',
  as: 'prescription',
  onDelete: 'CASCADE',
});
Prescription.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

Visit.hasMany(File, {
  foreignKey: 'visitId',
  as: 'files',
  onDelete: 'CASCADE',
});
File.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

// Appointment associations
Clinic.hasMany(Appointment, {
  foreignKey: 'clinicId',
  as: 'appointments',
  onDelete: 'CASCADE',
});
Appointment.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Patient.hasMany(Appointment, {
  foreignKey: 'patientId',
  as: 'appointments',
  onDelete: 'CASCADE',
});
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Appointment, {
  foreignKey: 'doctorId',
  as: 'appointments',
  onDelete: 'RESTRICT',
});
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// DoctorAvailability associations
User.hasMany(DoctorAvailability, {
  foreignKey: 'doctorId',
  as: 'availability',
  onDelete: 'CASCADE',
});
DoctorAvailability.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// Medicine associations
Clinic.hasMany(Medicine, {
  foreignKey: 'clinicId',
  as: 'medicines',
  onDelete: 'CASCADE',
});
Medicine.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

// PrescriptionTemplate associations
Clinic.hasMany(PrescriptionTemplate, {
  foreignKey: 'clinicId',
  as: 'prescriptionTemplates',
  onDelete: 'CASCADE',
});
PrescriptionTemplate.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

User.hasMany(PrescriptionTemplate, {
  foreignKey: 'createdBy',
  as: 'createdTemplates',
  onDelete: 'SET NULL',
});
PrescriptionTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Invoice associations
Clinic.hasMany(Invoice, {
  foreignKey: 'clinicId',
  as: 'invoices',
  onDelete: 'CASCADE',
});
Invoice.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

module.exports = {
  sequelize,
  Clinic,
  User,
  Patient,
  Visit,
  Prescription,
  File,
  Admin,
  Appointment,
  DoctorAvailability,
  Medicine,
  PrescriptionTemplate,
  Invoice,
};
