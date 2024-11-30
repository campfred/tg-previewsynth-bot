import { CallbackQueryContext, CommandContext, HearsContext, InlineQueryContext } from "https://deno.land/x/grammy@v1.32.0/context.ts";
import { CustomContext, WebLinkMap } from "./types.ts";

export function findMatchingMap(link: string, collection: WebLinkMap[]): WebLinkMap | null {
	const linkURL: URL = WebLinkMap.filterOutSubdomains(new URL(link));
	console.debug(`Finding equivalent for ${linkURL.origin} …`);
	for (const map of collection) {
		if (linkURL.hostname === map.destination.hostname) return map;
		for (const origin of map.origins)
			if (linkURL.hostname === origin.hostname) {
				console.debug(`Found ${map.name}!`);
				return map;
			}
	}
	console.debug(`Didn't find a matching ${WebLinkMap.name}. :(`);
	return null;
}

export function getExpeditorDebugString(ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext> | CallbackQueryContext<CustomContext>): string {
	return `${ctx.from?.first_name}${ctx.config.isDeveloper ? " [Developer]" : ""} (@${ctx.from?.username + " / "}${ctx.from?.id})`;
}
export function getQueryDebugString(ctx: CommandContext<CustomContext> | HearsContext<CustomContext> | InlineQueryContext<CustomContext>): string | RegExpMatchArray {
	return ctx.match.length < 1 ? "(nothing)" : ctx.match;
}
