const path = require("path");
import { Request, Response } from "express";
import { distDir } from "..";

export default class ExampleContoller {
	spa(req: Request, res: Response): void {
		console.log(`spa: ${req.path}`)
		return res.sendFile(path.join("index.html"), { root: distDir });
	}

	redirectForms(req: Request, res: Response): void {
		console.log('redirectForms')
		res.redirect("/forms");
	}
}