const sequelize = require('../config/database');

// Import models
const Clinic = require('./Clinic')(sequelize);
const User = require('./User')(sequelize);
const Patient = require('./Patient')(sequelize);
const Visit = require('./Visit')(sequelize);
const Prescription = require('./Prescription')(sequelize);
const File = require('./File')(sequelize);
const Admin = require('./Admin')(sequelize);

// Define associations
Clinic.hasMany(User, { foreignKey: 'clinicId', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Clinic.hasMany(Patient, { foreignKey: 'clinicId', as: 'patients', onDelete: 'CASCADE' });
Patient.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Clinic.hasMany(Visit, { foreignKey: 'clinicId', as: 'visits', onDelete: 'CASCADE' });
Visit.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

Patient.hasMany(Visit, { foreignKey: 'patientId', as: 'visits', onDelete: 'CASCADE' });
Visit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Visit, { foreignKey: 'doctorId', as: 'visits', onDelete: 'RESTRICT' });
Visit.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

Visit.hasOne(Prescription, { foreignKey: 'visitId', as: 'prescription', onDelete: 'CASCADE' });
Prescription.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

Visit.hasMany(File, { foreignKey: 'visitId', as: 'files', onDelete: 'CASCADE' });
File.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

module.exports = {
  sequelize,
  Clinic,
  User,
  Patient,
  Visit,
  Prescription,
  File,
  Admin
};

