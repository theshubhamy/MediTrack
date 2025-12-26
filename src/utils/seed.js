/**
 * Seed script to create initial clinic and admin user
 * Run this after setting up the database
 */

const bcrypt = require('bcrypt');
const prisma = require('../config/database');

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Create a clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Demo Clinic',
        phone: '1234567890',
        address: '123 Main Street, City',
        plan: 'FREE',
        subscriptionStatus: 'TRIAL'
      }
    });

    console.log('✅ Clinic created:', clinic.name);

    // Create users with different roles
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: 'Admin User',
        email: 'admin@clinic.com',
        phone: '1234567890',
        passwordHash,
        role: 'CLINIC_ADMIN',
        status: 'ACTIVE'
      }
    });

    const doctor = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: 'Doctor User',
        email: 'doctor@clinic.com',
        phone: '1234567891',
        passwordHash,
        role: 'DOCTOR',
        status: 'ACTIVE'
      }
    });

    const staff = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: 'Staff User',
        email: 'staff@clinic.com',
        phone: '1234567892',
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE'
      }
    });

    const readOnly = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: 'Read Only User',
        email: 'readonly@clinic.com',
        phone: '1234567893',
        passwordHash,
        role: 'READ_ONLY',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Users created with different roles:');
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
    console.log('👁️ READ_ONLY:');
    console.log('   Email: readonly@clinic.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('You can now login with any of the credentials above to test role-based access.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seed error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;

