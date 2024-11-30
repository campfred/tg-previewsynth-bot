import { Context } from "grammy";

export type LinkConfiguration = { name: string; origins: string[]; destination: string; enabled?: boolean };
export type FeaturesConfiguration = { link_recognition: boolean };
export type AboutConfiguration = { code_repo: string; owner: number; status_updates?: { chat: number; topic?: number } };

export type Configuration = {
	links: LinkConfiguration[];
	features: FeaturesConfiguration;
	about: AboutConfiguration;
};

export interface BotConfig {
	botDeveloper: number;
	isDeveloper: boolean;
}

export type CustomContext = Context & { config: BotConfig };

export class WebLinkMap {
	name: string;
	origins: URL[];
	destination: URL;
	enabled: boolean = true;

	/**
	 * Creates a WebLinkMap object representing a mapping between links for a website.
	 * @param name Friendly name of the website.
	 * @param origins Original URLs that will be converted.
	 * @param destination Destination URLs for conversions.
	 * @param enabled Toggles the website's support in functions or not.
	 */
	constructor(name: string, origins: URL[], destination: URL, enabled?: boolean) {
		this.name = name;
		this.origins = origins;
		this.destination = destination;
		this.enabled = enabled != undefined ? enabled : true;
		console.debug(`Created ${this.name} ${WebLinkMap.name} object that converts to ${this.destination.hostname} from ${this.origins.map((origin: URL): string => origin.hostname)}. It is ${this.enabled ? "enabled" : "disabled"}.`);
	}

	/**
	 * Checks if a given link can be handled by this map.
	 * @param link The link to check support for.
	 * @returns True if the link can be handled by this map.
	 */
	public isSupported(link: URL): boolean {
		for (const origin of this.origins) if (WebLinkMap.filterOutSubdomains(link).hostname === origin.hostname) return true;
		return false;
	}

	/**
	 * filterOutSubdomains
	 * @param link The link to remove subdomains from.
	 * @returns The link with subdomains removed.
	 */
	public static filterOutSubdomains(link: URL): URL {
		// if (!this.enabled) throw new Error("Map is disabled.");

		console.debug(`Filtering out subdomains of link ${link} …`);
		const filteredUrl: URL = new URL(link);
		const hostnameParts: string[] = filteredUrl.hostname.split(".");
		filteredUrl.hostname = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
		console.debug(`Filtered out subdomains of link : ${link} -> ${filteredUrl}`);
		return filteredUrl;
	}

	/**
	 * Fetches and expands a given link to the destination website.
	 * @param link The link to expand.
	 * @returns The expanded link.
	 */
	public static async expandLink(link: URL): Promise<URL> {
		console.debug(`Expanding link ${link} …`);
		const response: Response = await fetch(link);
		const expandedUrl: URL = new URL(response.url);
		response.body?.cancel();
		console.debug(`Expanded link : ${link} -> ${expandedUrl}`);
		return expandedUrl;
	}

	/**
	 * Removes search params from link.
	 * @param link The link to clean.
	 * @returns The cleaned link.
	 */
	public static cleanLink(link: URL): URL {
		console.debug(`Cleaning link ${link} …`);
		const linkCleaned = new URL(link.origin + link.pathname);
		console.debug(`Cleaned link : ${link} -> ${linkCleaned}`);
		return linkCleaned;
	}

	/**
	 * Converts a given link to the destination website, removing query parameters if necessary.
	 * @param link - The link to convert.
	 * @returns The converted link without query parameters.
	 * @throws Error if the link is unsupported or conversion is not needed.
	 */
	public convertLink(link: URL): URL {
		if (this.isSupported(link)) {
			console.debug(`Converting link from ${link} to point to ${this.destination} …`);
			const linkConverted = new URL(link);
			linkConverted.protocol = this.destination.protocol;
			linkConverted.hostname = this.destination.hostname;
			linkConverted.port = this.destination.port;
			console.debug(`Converted link : ${link} -> ${linkConverted}`);
			return linkConverted;
		} else throw Error("Unsupported link");
	}

	/**
	 * parseLink
	 */
	public async parseLink(link: URL): Promise<URL> {
		if (!this.enabled) throw new Error("Map is disabled.");

		return this.convertLink(WebLinkMap.cleanLink(WebLinkMap.filterOutSubdomains(await WebLinkMap.expandLink(link))));
	}
}
