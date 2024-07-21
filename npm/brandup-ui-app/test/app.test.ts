import { Application } from "../source/app";
import { ContextData } from "../source/middlewares/base";

const app = new Application({ basePath: "/" }, {});

it("Success run app", async () => {
	const app = new Application({ basePath: "/" }, {});

	const resultContext = await app.run<TestContextData>({
		test: "test"
	});

	expect(resultContext.app).toEqual(app);
	expect(resultContext.source).toEqual("first");
	expect(resultContext.url).toEqual("http://localhost/");
	expect(resultContext.origin).toEqual("http://localhost");
	expect(resultContext.path).toEqual("/");
	expect(resultContext.query.toString()).toEqual("");
	//expect(resultContext.query.size).toEqual(0);
	expect(resultContext.hash).toBeNull();
	expect(resultContext.replace).toEqual(false);
	expect(resultContext.external).toEqual(false);

	expect(resultContext.data.test).toEqual("test");
});

interface TestContextData extends ContextData {
	test: string
}