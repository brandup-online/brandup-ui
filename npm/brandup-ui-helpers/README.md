# brandup-ui-helpers

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-helpers](https://www.npmjs.com/package/@brandup/ui-helpers).

```
npm i @brandup/ui-helpers@latest
```

Метод строк `format()` для удобной подстановки значений.

Поддерживает как позиционные ({0}, {1}), так и именованные ({name}) аргументы

Автоматически обрабатывает отсутствующие значения (возвращает пустую строку)

Не модифицирует оригинальную строку

```ts
// Позиционные аргументы
"Привет, {0}".format("Мир"); // "Привет, Мир"
"Порядок: {1}, {0}".format("Первый", "Второй"); // "Порядок: Второй, Первый"

// Именованные аргументы (объект)
"Год: {year}".format({ year: 2024 }); // "Год: 2024"
"Имя: {name}, возраст: {age}".format({ name: "Иван", age: 30 }); // "Имя: Иван, возраст: 30"

// Несуществующие ключи возвращают пустую строку
"Привет, {unknown}".format({ name: "Пётр" }); // "Привет, "
```

Метод `prop()` к `Object` для безопасного доступа к вложенным свойствам.

Рекурсивно обрабатывает вложенные свойства через точку (obj.prop1.prop2)

Безопасно обрабатывает несуществующие пути (возвращает undefined)

```ts
const data = {
	user: {
		name: "Alex",
		contacts: {
			email: "mail@example.com",
			phone: "+1234567890",
		},
	},
};

// Получение значений
Object.prop(data, "user.name"); // "Alex"
Object.prop(data, "user.contats.email"); // "mail@example.com"

// Несуществующие свойства возвращают undefined
Object.prop(data, "user.age"); // undefined
Object.prop(data, "missing.property"); // undefined
```
