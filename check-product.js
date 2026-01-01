const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.generate_products.findUnique({
    where: { id: 37 }
  });
  console.log('AI Content:');
  console.log(JSON.stringify(product?.aicontent, null, 2));
}

main().then(() => prisma.$disconnect());
