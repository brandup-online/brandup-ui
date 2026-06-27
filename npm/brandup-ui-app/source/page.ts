import { UIElement } from "@brandup/ui";
import type { Application } from "./app";
import type { NavigateContext, ContextData } from "./middlewares/base";

/** How the page hash changed between navigations. */
export type PageHashAction = "add" | "remove" | "unchanged" | "changed";

/** Detail of the {@link PAGE_HASHCHANGE_EVENT} event. */
export interface PageHashChangedEvent {
	readonly page: Page;
	/** Hash before the change. */
	readonly prev: string | null;
	/** Hash after the change. */
	readonly new: string | null;
	/** Kind of the change. */
	readonly action: PageHashAction;
}

/** Name of the event a {@link Page} raises when its hash changes. */
export const PAGE_HASHCHANGE_EVENT = "hashchange";

/** Built-in events of every {@link Page}, merged with a subclass event map. */
export interface PageEvents {
	/** Raised after the page hash changes (and on the initial render if the page opens with a hash). */
	hashchange: (event: PageHashChangedEvent) => void;
}

/**
 * Base class for the page an {@link Application} holds as current (exposed via `app.page`).
 *
 * Owns the navigation context and url hash, and propagates hash changes to {@link onChangedHash}.
 * The page layer extends this and adds rendering/lifecycle; after the initial render it should
 * call {@link triggerChangeHash} once so a page opened with a hash is notified too.
 *
 * Recover the concrete page type in an application subclass by overriding the `page` getter:
 *
 * ```TypeScript
 * class MyApplication extends Application {
 *     override get page(): MyPage | null { return super.page as MyPage | null; }
 * }
 * ```
 */
export abstract class Page<TApplication extends Application = Application, TData extends ContextData = ContextData, TEvents = {}> extends UIElement<TEvents & PageEvents> {
	private __context: NavigateContext<TApplication, TData>;
	private __hash: string | null;

	constructor(context: NavigateContext<TApplication, TData>) {
		super();

		this.__context = context;
		this.__hash = context.hash;
	}

	/** Navigation context that the page is currently bound to. */
	get context(): NavigateContext<TApplication, TData> { return this.__context; }
	/** Current url hash of the page. */
	get hash(): string | null { return this.__hash; }

	/** @internal Re-bind the page to a hash-only navigation and notify it. */
	async __changedHash(context: NavigateContext<TApplication, TData>) {
		if (!this.element)
			return;

		this.__context = context;
		this.__hash = context.hash;

		await this.triggerChangeHash();
	}

	/**
	 * Notify the page of its hash relative to the previous navigation, when it differs.
	 * Call once after the initial render so a page opened with a hash is notified as well.
	 */
	protected async triggerChangeHash() {
		const prevHash = this.__context.current?.hash ?? null;
		if (!this.__hash && !prevHash)
			return;

		let action: PageHashAction;
		if (this.__hash && !prevHash)
			action = "add";
		else if (!this.__hash && prevHash)
			action = "remove";
		else if (this.__hash === prevHash)
			action = "unchanged";
		else
			action = "changed";

		await this.onChangedHash(this.__hash, prevHash, action);

		// Cast around the generic event map (the same trick UIElement uses for its built-in events).
		const event: PageHashChangedEvent = { page: this, prev: prevHash, new: this.__hash, action };
		(this.trigger as unknown as (name: string, ...args: any[]) => void)(PAGE_HASHCHANGE_EVENT, event);
	}

	/** Override to react to a change of the page url hash. */
	protected onChangedHash(_newHash: string | null, _oldHash: string | null, _action: PageHashAction): Promise<void> { return Promise.resolve(); }
}
