const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Knowledge Base...');

  // 1. Categories
  const categories = [
    { name: 'Оприходование товара', slug: 'prihod', description: 'Регламенты по работе со складом и поставщиками', targetRole: 'employee', sortOrder: 1 },
    { name: 'Контрагенты', slug: 'counterparts', description: 'Инструкции по заведению карточек клиентов и поставщиков', targetRole: 'employee', sortOrder: 2 },
    { name: 'Права и доступы', slug: 'access-rules', description: 'Управление ролями и разрешениями сотрудников', targetRole: 'admin', sortOrder: 3 },
    { name: 'Личный кабинет', slug: 'lk-guide', description: 'Инструкции для клиентов по использованию ЛК', targetRole: 'user', sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.knowledgeBaseCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  const prihodCat = await prisma.knowledgeBaseCategory.findUnique({ where: { slug: 'prihod' } });
  const accessCat = await prisma.knowledgeBaseCategory.findUnique({ where: { slug: 'access-rules' } });

  // 2. Initial Articles
  const articles = [
    {
      categoryId: prihodCat.id,
      title: 'Как оприходовать товар',
      slug: 'how-to-receive-goods',
      content: `# Регламент оприходования товара\n\n1. Перейдите в раздел **Склад -> Приемка**.\n2. Нажмите кнопку **Создать приемку**.\n3. Выберите поставщика из списка.\n4. Добавьте товары, указав количество и цену закупки.\n5. Нажмите **Провести**, чтобы обновить остатки на складе.`,
      excerpt: 'Пошаговая инструкция по приему товаров на склад.',
    },
    {
      categoryId: accessCat.id,
      title: 'Как добавить права сотруднику',
      slug: 'how-to-manage-permissions',
      content: `# Управление правами доступа\n\n1. Зайдите в раздел **Сотрудники**.\n2. Найдите нужного пользователя.\n3. Нажмите **Редактировать права**.\n4. Выберите нужные разрешения (например, \`warehouse.view\`) или добавьте пользователя в группу доступа.\n5. Сохраните изменения.`,
      excerpt: 'Инструкция для администраторов по настройке доступов.',
    }
  ];

  for (const art of articles) {
    await prisma.knowledgeBaseArticle.upsert({
      where: { slug: art.slug },
      update: art,
      create: art,
    });
  }

  console.log('Knowledge Base seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
