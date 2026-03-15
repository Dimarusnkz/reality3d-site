## Продакшен запуск (Reality3D)

Ниже — практичный чеклист, чтобы запуститься в продакшене на VPS/сервере Linux (Ubuntu/Debian). В примерах используется папка `/var/www/reality3d` и пользователь `r3d`.

### 1) Базовая подготовка сервера

- Обновить систему:

```bash
sudo apt update && sudo apt -y upgrade
```

- Установить Node.js LTS (20+) и инструменты:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs build-essential
node -v
npm -v
```

- Установить PM2:

```bash
sudo npm i -g pm2
pm2 -v
```

### 2) База данных (PostgreSQL)

- Установить PostgreSQL:

```bash
sudo apt -y install postgresql postgresql-contrib
```

- Создать БД/пользователя:

```bash
sudo -u postgres psql
CREATE USER reality3d WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE reality3d OWNER reality3d;
\\q
```

- Проверить строку подключения (пример):

```
DATABASE_URL=postgresql://reality3d:CHANGE_ME@127.0.0.1:5432/reality3d?schema=public
```

### 3) Каталоги для загрузок

Проект пишет файлы в:
- `/var/www/reality3d-uploads` (файлы ЛК /api/files)
- `/var/www/reality3d-uploads/public` (картинки блога /api/public)

Создать и выдать права:

```bash
sudo mkdir -p /var/www/reality3d-uploads/public
sudo chown -R r3d:r3d /var/www/reality3d-uploads
```

### 4) Переменные окружения (.env)

В `/var/www/reality3d/.env` задать минимум:

```bash
NODE_ENV=production
PORT=3001

DATABASE_URL=postgresql://reality3d:CHANGE_ME@127.0.0.1:5432/reality3d?schema=public

SESSION_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET

NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
NEXT_PUBLIC_TURNSTILE_ENABLED=true
TURNSTILE_ENABLED=true
```

`SESSION_SECRET` должен быть длинным случайным секретом. Генерация:

```bash
openssl rand -hex 32
```

### 5) Миграции Prisma

На продакшене используем migrations, а не db push:

```bash
cd /var/www/reality3d
npm ci
npx prisma migrate deploy
```

### 6) Сборка и запуск Next.js

```bash
cd /var/www/reality3d
npm run build
pm2 start npm --name reality3d -- start
pm2 save
```

Автозапуск после ребута:

```bash
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u r3d --hp /home/r3d
pm2 save
```

### 7) Nginx + SSL (Let’s Encrypt)

- Установить Nginx и certbot:

```bash
sudo apt -y install nginx certbot python3-certbot-nginx
```

- Пример конфига Nginx (замени домен):

`/etc/nginx/sites-available/reality3d.conf`

```nginx
server {
  server_name reality3d.ru www.reality3d.ru;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Активировать:

```bash
sudo ln -s /etc/nginx/sites-available/reality3d.conf /etc/nginx/sites-enabled/reality3d.conf
sudo nginx -t
sudo systemctl reload nginx
```

Выпустить сертификат:

```bash
sudo certbot --nginx -d reality3d.ru -d www.reality3d.ru
```

### 8) Защита (минимум)

- Firewall (UFW): открыть только ssh/80/443

```bash
sudo apt -y install ufw
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

- Rate limiting для /login и /register лучше делать на Nginx (добавим при необходимости).

### 9) Проверка после деплоя

- `/login` и `/register` должны показывать Turnstile и не принимать форму без токена.
- `/admin/blog` создание/редактирование статьи.
- Загрузка картинок блога: кнопка “Загрузить обложку”, затем открыть URL `/api/public/<file>`.
