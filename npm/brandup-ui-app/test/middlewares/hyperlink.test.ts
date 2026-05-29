import { DOM } from "@brandup/ui-dom";
import { ApplicationBuilder } from "../../source/builder";

const setLocation = (url: string) => {
	window.location.href = url;
	expect(window.location.href).toEqual(url);
};

const dispatchClick = (target: HTMLElement, init?: MouseEventInit) => {
	const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(event);
	return event;
};

it("HyperLink middleware ignores ctrl/meta clicks", async () => {
	setLocation("http://localhost/");

	const builder = new ApplicationBuilder({});
	const app = builder.build({ basePath: "/" });

	const appElem = DOM.tag("div");
	document.body.appendChild(appElem);
	await app.run({}, appElem);

	const link = DOM.tag("a", { href: "/about", class: "applink" }, "about");
	appElem.appendChild(link);

	// modifier clicks must be left to the browser (open in new tab) — not hijacked
	expect(dispatchClick(link, { metaKey: true }).defaultPrevented).toBe(false);
	expect(dispatchClick(link, { ctrlKey: true }).defaultPrevented).toBe(false);

	// plain click is handled by the SPA navigation
	expect(dispatchClick(link).defaultPrevented).toBe(true);

	await app.destroy();
	appElem.remove();
});
