const win = window;
const doc = window.document;
const body = doc.body;
const loc = window.location;

export default {
	window: win,
	document: doc,
	body,
	location: loc,
	reload: () => loc.reload()
};