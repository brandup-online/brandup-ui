import { Page } from "../../page";
import { REALTIME_NAME, RealtimeMiddleware } from "../../../middlewares/realtime";

export default class IndexModel extends Page {
	get typeName(): string { return "IndexModel" }
	get header(): string { return "User interface framework" }

	protected async onRenderContent(container: HTMLElement) {
		this.app.middleware<RealtimeMiddleware>(REALTIME_NAME).subscribe("main");

		const html = await import("./templates/index.html");
		container.insertAdjacentHTML("beforeend", html.default);
	}
}