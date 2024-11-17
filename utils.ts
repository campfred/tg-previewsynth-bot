import { WebLinkMap } from "./types.ts";

export function findMatchingMap(link: string, collection: WebLinkMap[]): WebLinkMap | null {
	const linkURL: URL = WebLinkMap.filterOutSubdomains(new URL(link));
	console.debug(`Finding equivalent for ${linkURL.origin} ...`);
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
