# DatabaseDoc

Документация базы данных в виде удобного веб-приложения.

## Быстрый запуск

### 1. Установка Node.js

Скачайте и установите Node.js с официального сайта: https://nodejs.org/

После установки проверьте:
```bash
node --version
npm --version
```

### 2. Подготовка файлов

Скачайте репозиторий:

```
git clone https://github.com/PuRu5heR/eljur-doc.git
```

### 3. Установка зависимостей

В терминале в папке проекта выполните:

```bash
npm install
```

### 4. Поместите JSON с данными

Скопируйте ваш `database.json` в папку `data/`

### 5. Запуск сервера

```bash
npm start
```

### 6. Открыть в браузере

Перейдите по адресу: **http://localhost:3000**

## Формат JSON

```json
{
  "НАЗВАНИЕ_ТАБЛИЦЫ_1": {
    "title": "Человекочитаемое название таблицы",
    "columns": [
      {
        "name": "ID",
        "type": "uuid",
        "notNull": true,
        "fk": null,
        "description": "Уникальный идентификатор",
        "check": null
      },
      {
        "name": "PERSON_ID",
        "type": "uuid",
        "notNull": true,
        "fk": "PERSON",
        "description": "Обучающийся",
        "check": null
      }
    ],
    "oneToMany": [
      {
        "table": "APPLICATION_FILE",
        "column": "APPLICATION_ID",
        "description": "Файлы заявления"
      },
      {
        "table": "APPLICATION_STATUS",
        "column": "APPLICATION_ID",
        "description": "История статусов"
      }
    ]
  },
  "НАЗВАНИЕ_ТАБЛИЦЫ_2": {
    "title": "...",
    "columns": [...],
    "oneToMany": [...]
  }
}
```
