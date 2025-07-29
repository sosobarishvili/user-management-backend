const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'qweqwe'; // You can change this before deploy
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        status: 'ACTIVE',
        lastLogin: new Date(),
      },
    });

    console.log('✅ Admin user created.');
  } else {
    console.log('ℹ️ Admin already exists. Skipping.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
