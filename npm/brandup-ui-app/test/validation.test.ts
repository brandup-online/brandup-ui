import { DOM } from "@brandup/ui";
import { ApplicationBuilder } from "../source/builder";
import CONSTANTS from "../source/constants";

const build = async () => {
	window.location.href = "http://localhost/";

	const appElem = DOM.tag("div");
	document.body.appendChild(appElem);

	const app = new ApplicationBuilder({}).build({ basePath: "/" });
	await app.run({}, appElem);

	return { app, appElem };
};

// Формы приложения живут внутри его корневого элемента — там же, где висит обработчик отправки.
const form = (appElem: HTMLElement) => {
	const input = DOM.tag("input", { type: "text", required: "" }) as HTMLInputElement;
	const skip = DOM.tag("button", { type: "submit", formnovalidate: "" }) as HTMLButtonElement;
	const formElem = DOM.tag("form", { class: CONSTANTS.FormClassName, method: "post", action: "/" }, [input, skip]) as HTMLFormElement;

	appElem.appendChild(formElem);

	return { formElem, input, skip };
};

it("invalid field is marked by class", async () => {
	const { app, appElem } = await build();
	const { input } = form(appElem);

	input.checkValidity();

	expect(input.classList.contains(CONSTANTS.InvalidElementClass)).toBeTruthy();
	expect(input.classList.contains(CONSTANTS.InvalidRequiredElementClass)).toBeTruthy();

	await app.destroy();
});

it("changing the field drops the mark", async () => {
	const { app, appElem } = await build();
	const { input } = form(appElem);

	input.checkValidity();
	input.value = "value";
	input.dispatchEvent(new Event("change", { bubbles: true }));

	expect(input.classList.contains(CONSTANTS.InvalidElementClass)).toBeFalsy();
	expect(input.classList.contains(CONSTANTS.InvalidRequiredElementClass)).toBeFalsy();

	await app.destroy();
});

it("submit that skips validation drops marks of the previous attempt", async () => {
	const { app, appElem } = await build();
	const { formElem, input, skip } = form(appElem);

	// Прошлая попытка: поле пустое, проверка отметила его.
	input.checkValidity();
	expect(input.classList.contains(CONSTANTS.InvalidElementClass)).toBeTruthy();

	formElem.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: skip }));
	await new Promise(resolve => setTimeout(resolve, 0));

	expect(input.classList.contains(CONSTANTS.InvalidElementClass)).toBeFalsy();
	expect(input.classList.contains(CONSTANTS.InvalidRequiredElementClass)).toBeFalsy();

	await app.destroy();
});

// Поле можно привязать к форме атрибутом `form`, оставив его в другом месте разметки: проверку формы
// оно проходит наравне с остальными, значит и метку с него снимать так же.
it("submit drops marks of a field attached by the form attribute", async () => {
	const { app, appElem } = await build();
	const { formElem, skip } = form(appElem);

	formElem.id = "attached-form";
	const outside = DOM.tag("input", { type: "text", required: "", form: "attached-form" }) as HTMLInputElement;
	appElem.appendChild(outside);

	outside.checkValidity();
	expect(outside.classList.contains(CONSTANTS.InvalidElementClass)).toBeTruthy();

	formElem.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: skip }));
	await new Promise(resolve => setTimeout(resolve, 0));

	expect(outside.classList.contains(CONSTANTS.InvalidElementClass)).toBeFalsy();
	expect(outside.classList.contains(CONSTANTS.InvalidRequiredElementClass)).toBeFalsy();

	await app.destroy();
});
