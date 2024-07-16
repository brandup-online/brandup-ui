import { Request, Response } from "express";
const path = require("path");
import { distDir } from "..";

export default class ExampleContoller {
    getHTMLTemplate(req: Request, res: Response): void {
        return res.sendFile(path.join("index.html"), { root: distDir });
    }

    redirectForms(req: Request, res: Response): void {
        res.redirect("/forms");
    }
}