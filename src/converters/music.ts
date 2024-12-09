import { OdesliResponse } from "../types/odesli.ts";
import { LinkConverter } from "../types/types.ts";
import { SimpleLinkConverter } from "./simple.ts";

export interface APIbasedLinkConverter extends LinkConverter {
	readonly base_url: URL;
	readonly api_key: string;
}

export class OdesliMusicConverter extends SimpleLinkConverter implements APIbasedLinkConverter {
	readonly base_url: URL = new URL("/v1-alpha.1/links", "https://api.song.link");
	readonly api_key: string = "";

	constructor(name: string, origins: URL[], destination: URL, enabled?: boolean, base_url?: URL, api_key?: string) {
		super(name, origins, destination, enabled ? enabled : true);
		if (api_key !== undefined) this.api_key = api_key;
		if (base_url !== undefined) this.base_url = new URL(base_url);
	}

	public override async convertLink(link: URL): Promise<URL> {
		const request_url: URL = this.base_url;
		request_url.searchParams.append("songIfSingle", "true");
		request_url.searchParams.append("url", encodeURI(SimpleLinkConverter.cleanLink(link).toString()));
		console.debug(`Sending request to ${request_url} …`);

		const response: OdesliResponse = await (await fetch(request_url.toString())).json();
		console.debug("Received response from API : ", response);
		const new_url: URL = new URL(response.pageUrl);
		console.debug("Converted music link : ", new_url);
		return new_url;
	}

	/**
	 * Parse a given link.
	 * @param link Link to convert.
	 * @returns Converted link.
	 */
	public override async parseLink(link: URL): Promise<URL> {
		if (!this.enabled) throw new Error("Map is disabled.");

		return this.convertLink(SimpleLinkConverter.cleanLink(await SimpleLinkConverter.expandLink(link)));
	}
}
