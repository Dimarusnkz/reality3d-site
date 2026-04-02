const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devGuideContent = `
# Инструкция для разработчиков Reality3D

Добро пожаловать в команду разработки Reality3D! Эта инструкция содержит актуальные данные о структуре и правилах работы в проекте.

## Основные параметры проекта

- **Технологический стек**: Next.js 16 (App Router), TypeScript, Prisma ORM, Tailwind CSS.
- **База данных**: PostgreSQL (Production), SQLite/MySQL (Dev/Optional).
- **Порт приложения**: **3000** (задается через переменную окружения \`PORT\`). Это критически важно для корректной работы NAT на MikroTik и Nginx.
- **URL проекта**: https://www.reality3d.ru

## Структура проекта и ключевые файлы

- \`/app\`: Основной код приложения (страницы, API роуты, серверные экшены).
- \`/lib\`: Логика приложения, инициализация БД, утилиты.
- **NEW!** \`lib/permissions.ts\`: Файл со справочником прав доступа и их русскими названиями. Используется как на сервере, так и в клиентских компонентах.
- \`lib/access.ts\`: Основная логика проверки прав доступа (RBAC).
- \`/prisma\`: Схемы базы данных и миграции.
- \`/scripts\`: Скрипты обслуживания (очистка БД, сиды, тесты).

## Управление доступом (Permissions)

В проекте используется гибкая система прав:
1. **Ключи прав**: Все ключи описаны в \`PermissionKey\` (\`lib/permissions.ts\`).
2. **Переводы**: Для отображения прав в интерфейсе используйте объект \`PERMISSION_LABELS\`.
3. **Проверка**:
   - В серверных экшенах: \`await requirePermission('key')\`.
   - В компонентах: \`await hasPermission(userId, role, 'key')\`.

## Деплой и инфраструктура

- **Сервер**: 10.20.0.40 (Ubuntu).
- **Процесс-менеджер**: PM2.
- **Веб-сервер**: Nginx (проксирует трафик с 443 на 3000).
- **Скрипты**:
  - \`deploy_remote.ps1\`: Деплой с локальной Windows-машины на сервер.
  - \`deploy_server.sh\`: Скрипт на сервере (Git pull + сборка + перезапуск).
  - \`build_server.sh\`: Чистая сборка проекта на сервере.

## Правила разработки

1. **Локализация**: Все системные сообщения, ошибки и уведомления должны быть на **русском языке**.
2. **Валидация**: Всегда используйте схемы Zod для проверки входных данных (\`lib/schemas\`). Устанавливайте адекватные лимиты на длину строк.
3. **Безопасность**: Используйте CSRF-защиту для всех мутирующих запросов.
4. **Docker**: Файлы Docker удалены, так как проект развертывается напрямую через PM2.
  `;

  // 1. Убедимся, что есть категория "Разработка"
  const category = await prisma.knowledgeBaseCategory.upsert({
    where: { slug: 'development' },
    update: { name: 'Разработка' },
    create: {
      name: 'Разработка',
      slug: 'development',
      sortOrder: 100,
      targetRole: 'admin'
    }
  });

  // 2. Добавим статью
  const article = await prisma.knowledgeBaseArticle.upsert({
    where: { slug: 'developer-onboarding' },
    update: {
      title: 'Инструкция для разработчиков (Onboarding)',
      content: devGuideContent,
      categoryId: category.id,
      isPublished: true
    },
    create: {
      title: 'Инструкция для разработчиков (Onboarding)',
      slug: 'developer-onboarding',
      content: devGuideContent,
      categoryId: category.id,
      isPublished: true
    }
  });

  console.log('SUCCESS: Developer guide added to Knowledge Base');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
