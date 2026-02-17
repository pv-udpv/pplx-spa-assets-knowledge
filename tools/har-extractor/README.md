# Perplexity JS Assets Extractor

Инструмент для извлечения JavaScript assets из HAR файлов Perplexity AI.

## Описание

Этот скрипт автоматически:
- Парсит HAR файл
- Извлекает все JS ресурсы (`.js` файлы, vendors, spa assets)
- Сохраняет их в директорию `js_assets/`
- Создает архив с метаданными
- Генерирует отчет об извлечении

## Требования

- Python 3.7+
- HAR файл (`www.perplexity.ai.har.json`)

## Использование

### Шаг 1: Скачайте HAR файл

1. Откройте [Space файлы](https://www.perplexity.ai/b/7198c5ce-669f-43b0-8a75-9b46a598c27e)
2. Найдите файл `www.perplexity.ai.har.json`
3. Скачайте его в ту же директорию, что и скрипт

### Шаг 2: Запустите экстрактор

```bash
python extract_js_assets.py
```

### Шаг 3: Результат

Скрипт создаст:
- `js_assets/` - директория с извлеченными JS файлами
- `perplexity_js_assets_YYYYMMDD_HHMMSS.zip` - архив со всеми assets
- `metadata.json` - метаданные об извлечении (внутри архива)

## Структура архива

```
perplexity_js_assets_20260217_150951.zip
├── js_assets/
│   ├── index.html-CbmY3HPE.js
│   ├── vendors-DrzD9yJ5.js
│   ├── platform-core-6g83OdbR.js
│   └── ...
└── metadata.json
```

## Метаданные

Файл `metadata.json` содержит:
- Дату и время извлечения
- Имя исходного HAR файла
- Статистику (количество файлов, размеры)
- Список всех извлеченных assets с URLs

## Статистика

После завершения работы скрипт выведет:

```
============================================================
СТАТИСТИКА ЭКСТРАКЦИИ
============================================================
Всего entries в HAR:     1247
JS файлов обнаружено:    43
Успешно извлечено:       42
Ошибок:                  1
Общий размер файлов:     2,456,789 bytes
Размер архива:           1,234,567 bytes
============================================================
```

## Фильтры JS файлов

Скрипт извлекает файлы по следующим критериям:
- MIME type: `application/javascript` или `text/javascript`
- URL оканчивается на `.js`
- URL содержит `/js/` или `/_spa/assets/`
- Имя файла содержит `vendors-`

## Troubleshooting

### HAR файл не найден

```
[!] HAR файл не найден: www.perplexity.ai.har.json
```

**Решение**: Убедитесь, что HAR файл находится в той же директории, что и скрипт.

### Ошибка декодирования

```
[!] Ошибка декодирования base64: https://example.com/script.js
```

**Решение**: Некоторые файлы в HAR могут быть повреждены. Это нормально, скрипт пропустит их и продолжит работу.

### Нет разрешения на запись

**Решение**: Убедитесь, что у вас есть права на запись в текущую директорию.

## Примеры использования

### Базовый запуск

```bash
python extract_js_assets.py
```

### Проверка результатов

```bash
# Посмотреть список извлеченных файлов
ls -lh js_assets/

# Разархивировать и посмотреть метаданные
unzip perplexity_js_assets_*.zip
cat metadata.json | python -m json.tool
```

### Поиск конкретного файла

```bash
# В архиве
unzip -l perplexity_js_assets_*.zip | grep vendors

# В директории
find js_assets/ -name "*vendors*"
```

## Структура кода

Основные функции:
- `extract_filename_from_url(url)` - извлекает имя файла из URL
- `extract_js_assets(har_file, output_dir)` - главная функция извлечения

## Лицензия

MIT

## Авторы

- Reverse Engineering Team
- E2B Sandbox Research Project

## Связанные проекты

- [pplx-sdk](https://github.com/pv-udpv/pplx-sdk) - Unofficial Perplexity AI SDK
- [E2B Sandbox Analysis](https://github.com/pv-udpv) - Complete E2B infrastructure RE

## Дата создания

2026-02-17 18:59:00 MSK

## Changelog

### v1.0.0 (2026-02-17)
- Первый релиз
- Базовая функциональность извлечения JS assets
- Поддержка HAR 1.2 формата
- Автоматическая генерация метаданных
- Создание ZIP архивов
