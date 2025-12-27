/**
 * Seed script to create initial super admin, clinic and users
 * Run this after setting up the database
 */

const bcrypt = require('bcrypt');
const { Clinic, User, Admin, sequelize } = require('../models');

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Test database connection first
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    console.log('');

    // Create super admin
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@meditrack.com',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    });

    console.log('✅ Super Admin created:', superAdmin.email);
    console.log('');

    // Create a clinic
    const clinic = await Clinic.create({
      name: 'Demo Clinic',
      phone: '1234567890',
      address: '123 Main Street, City',
      plan: 'FREE',
      subscriptionStatus: 'TRIAL',
    });

    console.log('✅ Clinic created:', clinic.name);
    console.log('');

    // Create users with different roles
    const passwordHash = await bcrypt.hash('admin123', 10);

    const clinicAdmin = await User.create({
      clinicId: clinic.id,
      name: 'Admin User',
      email: 'admin@clinic.com',
      phone: '1234567890',
      passwordHash,
      role: 'CLINIC_ADMIN',
      status: 'ACTIVE',
    });

    const doctor = await User.create({
      clinicId: clinic.id,
      name: 'Doctor User',
      email: 'doctor@clinic.com',
      phone: '1234567891',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    });

    const staff = await User.create({
      clinicId: clinic.id,
      name: 'Staff User',
      email: 'staff@clinic.com',
      phone: '1234567892',
      passwordHash,
      role: 'STAFF',
      status: 'ACTIVE',
    });

    console.log('✅ Users created with different roles:');
    console.log('');
    console.log('🔐 SUPER ADMIN (System Admin):');
    console.log('   Email: admin@meditrack.com');
    console.log('   Password: admin123');
    console.log('   Login URL: /admin/login');
    console.log('');
    console.log('👑 CLINIC_ADMIN:');
    console.log('   Email: admin@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👨‍⚕️ DOCTOR:');
    console.log('   Email: doctor@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 STAFF:');
    console.log('   Email: staff@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log(
      'You can now login with any of the credentials above to test role-based access.',
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('');
      console.error(
        '💡 Tip: Make sure your database is running and check your .env file.',
      );
      console.error('   For local development, set DB_HOST=localhost');
      console.error('   For Docker, set DB_HOST=postgres');
    }
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
