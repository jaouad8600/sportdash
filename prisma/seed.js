const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const groupA = await prisma.group.create({ data: { name: 'Poel' } });
  const groupB = await prisma.group.create({ data: { name: 'Lier' } });

  const adminPassword = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const glPassword = await bcrypt.hash('gl', 10);
  await prisma.user.create({
    data: {
      email: 'gl@example.com',
      name: 'Group Leader',
      password: glPassword,
      role: Role.GL,
      groups: { connect: [{ id: groupA.id }] },
    },
  });

  const docPassword = await bcrypt.hash('docent', 10);
  await prisma.user.create({
    data: {
      email: 'docent@example.com',
      name: 'Sport Docent',
      password: docPassword,
      role: Role.DOCENT,
      groups: { connect: [{ id: groupA.id }, { id: groupB.id }] },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
