# Сторонние компоненты PostMegaMan

Общая [лицензия MIT](LICENSE) распространяется на собственный код и материалы PostMegaMan. Она не меняет лицензии перечисленных ниже компонентов и игровых данных. Уведомления исходных авторов сохраняются.

## 1. Редактор тела запроса

Используется CodeMirror 6 с языком JSON. Собственные HTML-обвязка, обмен с 1С и настройки редактора находятся в `src/PostMegaMan/RequestEditor/`.

Основные закреплённые зависимости:

| Пакет | Версия |
|---|---|
| `@codemirror/commands` | 6.11.1 |
| `@codemirror/lang-json` | 6.0.2 |
| `@codemirror/state` | 6.7.0 |
| `@codemirror/view` | 6.43.13 |
| `@babel/core` | 8.0.6 |
| `@babel/preset-env` | 8.0.6 |
| `esbuild` | 0.28.2 |

Полный набор зависимостей зафиксирован в [package-lock.json](src/PostMegaMan/RequestEditor/package-lock.json). Полные лицензии и уведомления авторов находятся в [LICENSES.md](src/PostMegaMan/RequestEditor/LICENSES.md), включая транзитивные зависимости. Сведения о сборке: [README редактора](src/PostMegaMan/RequestEditor/README.md).

Поставленный HTML-редактор и макет `РедакторЗапросаHTML` также содержат уведомления компонентов. Их нельзя удалять при распространении.

Оригинальный проект редактора: [CodeMirror](https://codemirror.net/).

## 2. Движок DoomGenericJS

Источник: [grubbyplaya/doomgenericjs](https://github.com/grubbyplaya/doomgenericjs/tree/99d7a55651b5f774e9b8911ef96e91a3652ef85f), commit `99d7a55651b5f774e9b8911ef96e91a3652ef85f`.

В файлах движка сохранены уведомления авторов, в том числе id Software и Simon Howard. GPL-файлы распространяются по **GNU GPL версии 2 или, по выбору получателя, более поздней версии**.

- [Текст GPL v2](third-party/doom/COPYING-GPL-2.0.txt).
- [Архив соответствующих исходников движка](third-party/doom/doomgenericjs-99d7a556-sources.zip).
- [Происхождение, проверка соответствия и сборка](third-party/doom/README.md).

MIT PostMegaMan не применяется к этому движку. При перераспространении его исполняемой сборки необходимо соблюдать условия GPL, включая предоставление соответствующих исходников.

Встроенная копия JavaScript движка совпадает с указанной версией upstream после нормализации внешних пробелов и переводов строк. Собственная интеграция с HTML-полем находится в `src/PostMegaMan/Templates/DoomHTML/Ext/Template.txt`; она поставляется как исходный текст вместе с обработкой.

## 3. DOOM shareware: игровые данные

Игровой файл **DOOM1.WAD** принадлежит id Software и сохраняет отдельные условия shareware. Он не является кодом PostMegaMan и не лицензируется по MIT или GPL движка.

- [Полное уведомление и условия](third-party/doom/LICENSE-DOOM1.txt).
- Источник данных: [архив DOOM shareware 1.9](https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/doom/doom19s.zip).
- Опубликованная копия уведомления: [LICENSE-DOOM1](https://github.com/redox-os/freedoom/blob/master/LICENSE-DOOM1), включая разъяснение о распространении shareware WAD.

Файл WAD включён в HTML-макет без изменения содержимого. Зарегистрированные эпизоды игры и `DOOM.EXE` в поставку не входят.

## 4. Область собственной лицензии

MIT с Copyright © 2026 SmaginAV применяется к собственным BSL-модулям, формам, документации, примерам, созданным для PostMegaMan иконкам и собственным частям HTML/JavaScript-обвязок. Внутри составных HTML-ресурсов сторонний код сохраняет свои лицензии, перечисленные выше.

Наличие общей MIT не даёт права удалять сторонние уведомления или распространять сторонние части на условиях, противоречащих их лицензиям. Изображения интерфейса показывают работу программы; сторонние логотипы и игровые изображения не объявляются исключительной собственностью автора PostMegaMan.
