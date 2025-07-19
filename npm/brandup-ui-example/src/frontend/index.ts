import "./fix";
import AREAS from "./areas";
import "./styles/styles.less";

AREAS.registerArea('', {
	app: () => import("./areas/landing/landing")
});

AREAS.registerArea('account', {
	app: () => import("./areas/account/account")
});

var area = AREAS.findArea();
if (!area)
	area = AREAS.findArea('');
if (!area)
	throw new Error('Not found app area.');

var appFactory = await area.app();
var builder = appFactory.default();
const app = builder.build({ basePath: area.basePath });
app.run();