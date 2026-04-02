const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devGuideContent = `
# Инструкция для разработчиков Reality3D (Extended)

Добро пожаловать в команду разработки Reality3D! Этот документ является основным источником знаний о внутренней архитектуре и правилах работы в проекте.

## 🏗️ Архитектура и Стек

- **Framework**: Next.js 16 (App Router). Мы активно используем Server Components для рендеринга и Server Actions для мутаций.
- **Language**: TypeScript (строгая типизация обязательна).
- **ORM**: Prisma. Поддерживается работа с несколькими БД (Postgres, SQLite, MySQL).
- **Styling**: Tailwind CSS + Lucide Icons.
- **Validation**: Zod (используется во всех формах и API).

## 📂 Структура проекта

- \`/app\`: Маршрутизация и UI.
  - \`/actions\`: Серверные экшены (бизнес-логика мутаций).
  - \`/admin\`: Панель управления (склад, заказы, пользователи, чат).
  - \`/api\`: Route Handlers для внешних интеграций и системных функций.
  - \`/lk\`: Личный кабинет клиента.
  - \`/shop\`: Публичная часть магазина.
- \`/lib\`: Общие утилиты и сервисы.
  - \`access.ts\`: Проверка прав (RBAC).
  - \`prisma.ts\`: Инициализация и получение клиента БД.
  - \`session.ts\`: Управление сессиями и JWT.
  - \`csrf.ts\`: Защита от CSRF-атак.
  - \`audit.ts\`: Логирование важных действий.
  - \`/services\`: Слой сервисов (OrderService, WarehouseService) для сложной логики.

## 🔐 Безопасность и Права (RBAC)

1. **Permissions**: Все права описаны в \`lib/permissions.ts\`. Каждое право имеет ключ (например, \`warehouse.view\`) и русское название.
2. **Roles**: Основные роли: \`admin\`, \`employee\`, \`user\`, \`client\`. Админы имеют доступ ко всему.
3. **Check**: Используйте \`await requirePermission('key')\` в экшенах или \`await hasPermission(...)\` в компонентах.
4. **CSRF**: Любая мутация (Action/API) обязана вызывать \`assertCsrf(formData)\` или \`assertCsrfTokenValue(token)\`.
5. **DTO/Select**: Запрещено возвращать полный объект \`User\` на клиент. Всегда используйте \`select\` для исключения \`password\`.

## 📦 Основные Модули

### 1. Склад (Warehouse)
- **Модели**: \`Warehouse\`, \`WarehouseLocation\`, \`ShopProduct\`, \`ShopInventoryItem\`.
- **Процессы**: Приемка (\`Receipt\`), Перемещение (\`Transfer\`), Производство (\`Production\`) по рецептам (\`Recipe\`), Инвентаризация (\`InventoryCount\`).
- **Логирование**: Каждое изменение остатков фиксируется в \`ShopWarehouseLog\`.

### 2. Магазин (Shop)
- **Заказы**: \`ShopOrder\` с привязкой к \`User\` или гостевой сессии.
- **Оплата**: Интеграция с Т-Банком (обработка вебхуков в \`app/api/payments/tbank/route.ts\`).
- **Доставка**: Расчет стоимости (\`shipping.ts\`) и отслеживание статусов.

### 4. Автоматизация через MAX Bot
- **Бот-ассистент**: Позволяет создавать карточки товаров (/new_product) и проверять остатки (/stock).
- **Процесс создания**:
  1. Загрузка фото -> 2. Название -> 3. Категория (кнопки) -> 4. Описание/Цена.
  - При успешном создании бот возвращает прямую ссылку на товар на сайте.
- **Безопасность**: Доступ только для верифицированных ChatID администраторов.

## 🛠️ Правила разработки (Best Practices)

1. **Локализация**: Тексты ошибок, уведомления и логи — только на **русском языке**.
2. **Валидация**: Используйте схемы из \`lib/schemas\`. Не доверяйте данным с клиента.
3. **Логирование**: Важные события (смена статуса заказа, удаление данных, вход) логируйте через \`logAudit\`.
4. **Rate Limiting**: Используйте \`rateLimit(key, limit, window)\` для защиты от брутфорса и спама.
5. **Database**: Всегда используйте \`getPrisma()\` вместо прямого импорта клиента.

## 🚀 Деплой

- Проект работает под управлением **PM2**.
- Для деплоя используйте \`./deploy_remote.ps1\` (с локальной машины) или \`./deploy_server.sh\` (на сервере).
- Порт приложения: **3000** (обязательно для проксирования Nginx).
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
