# Происхождение Doom в PostMegaMan

## Движок и соответствующие исходники

Используется [DoomGenericJS](https://github.com/grubbyplaya/doomgenericjs/tree/99d7a55651b5f774e9b8911ef96e91a3652ef85f), commit `99d7a55651b5f774e9b8911ef96e91a3652ef85f`.

[doomgenericjs-99d7a556-sources.zip](doomgenericjs-99d7a556-sources.zip) содержит отслеживаемые файлы движка из `doomgeneric/` этой версии, Makefile, исходные README и уведомления авторов. Игровой файл `doomgeneric/doom1.wad` из upstream исключён: используемые здесь игровые данные имеют отдельное происхождение и лицензию. Примеры upstream и их сторонние библиотеки, иллюстрации и настройки Git не включены. Дополнительно в архив включён полный текст GPL v2 как `COPYING`.

Встроенный JavaScript движка совпадает с `doomgeneric/doomgeneric.js` этой версии после нормализации переводов строк и внешних пробелов. Проверка сделана при подготовке публикации 06.10.2026.

Полный текст GPL: [COPYING-GPL-2.0.txt](COPYING-GPL-2.0.txt). Исходные уведомления в C-файлах сохранены; для GPL-файлов действует GPL-2.0-or-later.

## Сборка движка

В upstream есть `doomgeneric/Makefile`, использующий **Emscripten (`emcc`)** и `make`. После подготовки совместимого инструментария сборка выполняется из распакованного дерева:

```sh
make -C doomgeneric
```

Этот Makefile задаёт `-sWASM=0`, `-sSINGLE_FILE=1`, `-sENVIRONMENT=web` и экспорт функций движка. Выходной файл — `doomgeneric/doomgeneric.js`. Для среды 1С использована JavaScript-сборка без WebAssembly.

Точная версия Emscripten для upstream-сборки в имеющихся материалах не закреплена. Повторная компиляция и побайтовое воспроизведение JavaScript при подготовке публикации не выполнялись. Поставляются исходники и Makefile именно указанной версии, а не ссылка на текущую ветку проекта.

## Интеграция с 1С

HTML, загрузка игровых данных, canvas, ввод, масштабирование и управление жизненным циклом находятся в полном исходном макете:

[src/PostMegaMan/Templates/DoomHTML/Ext/Template.txt](../../src/PostMegaMan/Templates/DoomHTML/Ext/Template.txt).

Макет содержит встроенный движок и WAD в base64. Для работы обработка не скачивает игровые ресурсы из сети; звук отключён. Собственные изменения интеграции можно изучать непосредственно в HTML-макете. Структура модулей и форм 1С поставляется в `src/`.

## Игровые данные

Используется **DOOM shareware 1.9, первый эпизод**. Источник — [архив id Software](https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/doom/doom19s.zip). Лицензия: [LICENSE-DOOM1.txt](LICENSE-DOOM1.txt).

Контрольные суммы исходных материалов:

| Материал | SHA-256 |
|---|---|
| Upstream `doomgeneric.js` | `7620A5AE6EEC292479779B2A466DFC90E1A3FF395580DCCBCC92A08C7FA5FA3E` |
| Архив `doom19s.zip` | `CACF0142B31CA1AF00796B4A0339E07992AC5F21BC3F81E7532FE1B5E1B486E6` |
| Встроенный `DOOM1.WAD` | `1D7D43BE501E67D927E415E0B8F3E29C3BF33075E859721816F652A526CAC771` |

Игровые данные не изменены. Их лицензия не заменяется лицензией движка. Регистрационная версия игры и DOS-исполняемый файл не включены.
