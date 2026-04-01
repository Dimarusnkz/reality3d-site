const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devGuideContent = `
# Инструкция для разработчиков Reality3D

Добро пожаловать в команду разработки Reality3D! Эта краткая инструкция поможет вам быстро разобраться в проекте и избежать распространенных ошибок.

## Основные параметры проекта

- **Технологический стек**: Next.js 16 (App Router), TypeScript, Prisma ORM, Tailwind CSS.
- **База данных**: PostgreSQL (Production), SQLite/MySQL (Dev/Optional).
- **Порт приложения**: **3000** (задается через переменную окружения \`PORT\`). Это критически важно для корректной работы NAT на MikroTik и Nginx.
- **URL проекта**: https://www.reality3d.ru

## Структура проекта

- \`/app\`: Основной код приложения (страницы, API роуты, серверные экшены).
  - \`/app/admin\`: Панель управления администратора.
  - \`/app/lk\`: Личный кабинет клиента.
  - \`/app/api\`: API эндпоинты (включая вебхуки оплат и интеграции).
- \`/components\`: Общие React-компоненты.
  - \`/components/ui\`: Базовые UI элементы (кнопки, карточки, формы).
- \`/lib\`: Общие утилиты, инициализация БД (Prisma), логика сессий и прав доступа.
- \`/prisma\`: Схемы базы данных и миграции.
- \`/scripts\`: Скрипты автоматизации, тесты и сиды.

## Деплой и инфраструктура

- **Сервер**: 10.20.0.40 (Ubuntu).
- **Процесс-менеджер**: PM2.
- **Веб-сервер**: Nginx (проксирует трафик с 443 на 3000).
- **Скрипты**:
  - \`deploy_remote.ps1\`: Скрипт для деплоя с локальной машины Windows на сервер.
  - \`deploy_server.sh\`: Скрипт на стороне сервера для обновления кода из Git, сборки и перезапуска PM2.
  - \`build_server.sh\`: Скрипт сборки (миграции Prisma + next build).

## Правила разработки

1. **Безопасность**: Всегда используйте \`CSRF\` токены для \`POST/PUT/DELETE\` запросов.
2. **Права доступа**: Проверяйте права через \`requirePermission()\` в серверных экшенах. Ключи прав описаны в \`lib/access.ts\`.
3. **Порты**: Не меняйте порт запуска без согласования, так как он завязан на сетевое оборудование (MikroTik).
4. **Docker**: Проект НЕ использует Docker для продакшена. Деплой идет напрямую на VPS.
  `;

  // 1. Убедимся, что есть категория "Разработка"
  const category = await prisma.knowledgeBaseCategory.upsert({
    where: { slug: 'development' },
    update: { name: 'Разработка' },
    create: {
      name: 'Разработка',
      slug: 'development',
      icon: 'code',
      sortOrder: 100
    }
  });

  // 2. Добавим статью
  const article = await prisma.knowledgeBaseArticle.upsert({
    where: { slug: 'developer-onboarding' },
    update: {
      title: 'Инструкция для разработчиков (Onboarding)',
      content: devGuideContent,
      categoryId: category.id,
      published: true
    },
    create: {
      title: 'Инструкция для разработчиков (Onboarding)',
      slug: 'developer-onboarding',
      content: devGuideContent,
      categoryId: category.id,
      published: true
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
