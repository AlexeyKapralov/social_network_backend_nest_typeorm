# Этап 1: Сборка проекта с использованием Node.js
FROM node:22

# Установите рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

RUN npm install

# Скопируйте остальные файлы проекта
COPY . .

# Скомпилируйте TypeScript в JavaScript
RUN npm run build

# Переключитесь на пользователя node для безопасности
USER node

# Открываем порт для приложения (3000)
EXPOSE 4000

CMD [ "node", "dist/main.js" ]