interface Constants {
	readonly LoadingElementClass: string;
	readonly NavUrlClassName: string;
	readonly FormClassName: string;
	readonly NavUrlAttributeName: string;
	readonly NavUrlReplaceAttributeName: string;
	readonly NavIgnoreAttributeName: string;
	readonly STATE_CLASS: {
		readonly LOADING: string;
		readonly LOADED: string;
		readonly READY: string;
	};
}

const result: Constants = {
	LoadingElementClass: "loading",
	NavUrlClassName: "applink",
	FormClassName: "appform",
	NavUrlAttributeName: "data-nav-url",
	NavUrlReplaceAttributeName: "data-nav-replace",
	NavIgnoreAttributeName: "data-nav-ignore",
	STATE_CLASS: {
		LOADING: "bp-state-loading",
		LOADED: "bp-state-loaded",
		READY: "bp-state-ready"
	}
};

export default result;