import { Middleware, MiddlewareNext, StartContext, StopContext, SubmitContext } from "./base";
import CONSTANTS from "../constants";
import BROWSER from "../browser";

export const FORM_MIDDLEWARE_NAME = "app-form";

const FormMiddlewareFactory = (): Middleware => {
	let onWindowSubmit: (e: SubmitEvent) => void | undefined;

	return {
		name: FORM_MIDDLEWARE_NAME,
		start: async (context: StartContext, next: MiddlewareNext) => {
			await next();

			BROWSER.window.addEventListener("submit", onWindowSubmit = (e: SubmitEvent) => {
				const form = e.target as HTMLFormElement;
				if (!form.classList.contains(CONSTANTS.FormClassName))
					return;

				e.preventDefault();

				context.app.submit({ form, button: e.submitter instanceof HTMLButtonElement ? <HTMLButtonElement>e.submitter : null });
			}, false);
		},
		submit: async (context: SubmitContext, next: MiddlewareNext) => {
			const { form, button, method } = context;

			if (!form.checkValidity())
				return Promise.reject('Form is invalid.');

			if (form.classList.contains(CONSTANTS.LoadingElementClass))
				return form["_submit_"];
			form.classList.add(CONSTANTS.LoadingElementClass);

			if (button)
				button.classList.add(CONSTANTS.LoadingElementClass);

			context.replace = form.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName);
			if (button && button.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName))
				context.replace = true;

			try {
				if (method === "GET")
					await context.app.nav({ url: context.url, query: new FormData(form), data: context.data });
				else
					await next();
			}
			finally {
				form.classList.remove(CONSTANTS.LoadingElementClass);

				if (button)
					button.classList.remove(CONSTANTS.LoadingElementClass);
			}
		},
		stop: (_context: StopContext, next: MiddlewareNext) => {
			BROWSER.window.removeEventListener("submit", onWindowSubmit, false);

			return next();
		}
	};
};

export default FormMiddlewareFactory;