import { Router } from "express";
import ExampleContoller from "../controllers/example.contoller";

class ExampleRoutes {
	router = Router();
	controller = new ExampleContoller();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {
		this.router.get("redirect", this.controller.redirectForms);

		this.router.get("*", this.controller.spa);
	}
}

export default new ExampleRoutes().router;