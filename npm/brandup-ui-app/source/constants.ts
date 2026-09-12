interface Constants {
	readonly LoadingElementClass: string;
	readonly NavUrlClassName: string;
	readonly FormClassName: string;
	readonly InvalidElementClass: string;
	readonly InvalidRequiredElementClass: string;
	readonly NavUrlAttributeName: string;
	readonly NavUrlReplaceAttributeName: string;
	readonly NavUrlScopeAttributeName: string;
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
	InvalidElementClass: "invalid",
	InvalidRequiredElementClass: "invalid-required",
	NavUrlAttributeName: "data-nav-url",
	NavUrlReplaceAttributeName: "data-nav-replace",
	NavUrlScopeAttributeName: "data-nav-scope",
	NavIgnoreAttributeName: "data-nav-ignore",
	STATE_CLASS: {
		LOADING: "bp-state-loading",
		LOADED: "bp-state-loaded",
		READY: "bp-state-ready"
	}
};

export default result;