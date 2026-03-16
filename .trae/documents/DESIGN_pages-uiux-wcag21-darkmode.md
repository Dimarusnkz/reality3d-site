# Page Design Specification (desktop-first)

## Global Styles (Design System)

### Design tokens (CSS variables)
- Colors (semantic):
  - `--bg`, `--bg-elevated`, `--text`, `--text-muted`, `--border`, `--primary`, `--primary-contrast`, `--danger`, `--focus`
  - Light theme defaults: светлый фон, тёмный текст, акцент `--primary`.
  - Dark theme defaults: тёмный фон, светлый текст, повышенный контраст границ и focus ring.
- Typography:
  - Base: 16px; scale: 12/14/16/18/20/24/32.
  - Line-height: 1.5 для текста, 1.2 для заголовков.
- Spacing: 4/8/12/16/24/32/48.
- Radius: 8 (cards/inputs), 12 (modals), 999 (pills).
- Shadows: 2 уровня (elevated card, modal).

### Accessibility (WCAG 2.1 AA)
- Контраст: все текстовые пары ≥ AA; интерактивные элементы имеют видимые состояния `hover/active/focus`.
- Keyboard-first:
  - Полный tab-порядок; focus не «теряется».
  - `Skip to content` ссылка вверху страницы.
  - Модальные окна: focus trap, закрытие по Esc, восстановление фокуса.
- Semantics/ARIA:
  - Навигация в `<nav>`, основной контент в `<main>`, футер в `<footer>`.
  - Иконки: `aria-hidden="true"` если декоративные; иначе `aria-label`.
- Motion:
  - Уважать `prefers-reduced-motion`; анимации ≤ 200ms и не критичны для понимания.

### Theme (dark mode)
- Переключатель: `Light / Dark / System`.
- Хранение выбора: localStorage + синхронизация с `prefers-color-scheme` при режиме System.

### Layout system
- База: CSS Grid для каркаса страниц + Flexbox для внутренних блоков.
- Desktop-first:
  - Контентная ширина: 1200–1280px max, центрирование.
  - Breakpoints: 1280/1024/768/480 (ниже 768 — упрощение навигации).

---

## Page: Главная (публичная)

### Meta Information
- Title: «Главная»
- Description: краткое описание продукта/сервиса
- Open Graph: `og:title`, `og:description`, `og:type=website`

### Page Structure
- Верхняя панель (sticky)
- Hero/ключевое сообщение
- Контентные секции (карточки/лента)
- Футер

### Sections & Components
1) Header / Top Nav
- Логотип слева.
- Основные ссылки навигации (публичные разделы).
- Справа: кнопки «Войти», «ЛК» (если авторизован), переключатель темы.
- Доступность:
  - `Skip to content` перед nav.
  - Активный пункт меню с `aria-current="page"`.

2) Main content
- Секции строятся как `section` с заголовком `h2`.
- Карточки: одинаковые отступы/рамки/hover, кликабельная область с понятным фокусом.

3) Performance UX
- Скелетоны для блоков, которые загружаются асинхронно.
- Lazy-load изображений ниже первого экрана.

---

## Page: Вход/Регистрация

### Meta Information
- Title: «Вход» / «Регистрация»
- Description: безопасный вход в систему

### Page Structure
- Двухколоночный layout на desktop (слева форма, справа подсказки/политики), на mobile — одна колонка.

### Sections & Components
1) Auth Card
- Поля: email, пароль.
- Кнопка submit.
- Ссылка переключения «Войти ↔ Регистрация».
- Ошибки: под полем, кратко и без технических деталей.
- Security UX:
  - Индикатор «Caps Lock включён» (если возможно).
  - Подсказка политики пароля (если применимо).

2) Session handling
- После успешного входа редирект в ЛК.
- Если недостаточно прав — явное сообщение и ссылка на главную.

---

## Page: Личный кабинет

### Meta Information
- Title: «Личный кабинет»
- Description: работа в защищённой зоне

### Page Structure
- App Shell: левый сайдбар + основная область.
- В основной области: заголовок, хлебные крошки (опционально), контент.

### Sections & Components
1) Sidebar (RBAC-aware)
- Пункты меню показываются только при наличии прав.
- Активный пункт подсвечен.
- Сверху — краткий профиль (email/аватар), снизу — выход.

2) Security & Settings module (в /lk/settings)
- Theme selector (Light/Dark/System).
- Управление сессиями: список активных сессий (устройство/время), кнопка «Завершить».
- Доступность: переключатель «уменьшить анимации» (если включено в продукте).

---

## Page: Админ‑панель

### Meta Information
- Title: «Администрирование»
- Description: управление безопасностью, производительностью и БД

### Page Structure
- App Shell как в ЛК, но с административными разделами.
- Основной контент: табы/подразделы.

### Sections & Components
1) Admin Navigation
- Разделы: «Роли и права», «Аудит», «Производительность», «Базы данных».
- Визуально отделить опасные действия (например, красные кнопки для операций переключения/миграций).

2) Роли и права (RBAC)
- Таблица ролей (name, description).
- Просмотр/редактирование матрицы разрешений (ресурс → действия).
- Назначение ролей пользователям (поиск пользователя, список ролей).

3) Аудит
- Таблица событий: время, актор, действие, цель.
- Фильтры: период, актор, тип действия.

4) Производительность
- Карточки метрик: p95 latency API, error rate, ключевые web vitals.
- Таблица «медленные операции/эндпоинты».

5) Базы данных (SQLite + MySQL/MariaDB)
- Блок «Текущий режим».
- Health-check карточки по доступности.
- Действия: «Проверить подключение», «Запустить миграции», «Переключить режим».
- Safety UX:
  - Диалог подтверждения с явным описанием последствий.
  - Блокировка кнопки при незаполненных/невалидных параметрах.

---

## Interaction States (общие)
- Buttons: `default / hover / active / focus / disabled / loading`.
- Inputs: `default / focus / error / disabled` + подсказки.
- Tables: фиксированный header, подсветка строки при фокусе (keyboard navigation).

## Responsive behavior (минимально необходимое)
- До 768px:
  - Сайдбар сворачивается в drawer.
  - Таблицы переходят в карточный вид (key-value) или горизонтальный scroll.
  - Увеличенные зоны нажатия (min 44px).