import { getLogger, Logger } from "@logtape/logtape"
import { CacheManager } from "../managers/cache.ts"
import { OdesliResponse } from "../types/odesli.ts"
import { ConversionTypes, LinkConverter } from "../types/types.ts"
import { SimpleLinkConverter } from "./simple.ts"
import { LogCategories } from "../managers/logging.ts"

const CACHE: CacheManager = CacheManager.Instance
const LOGGER: Logger = getLogger([LogCategories.BOT, LogCategories.APIS]).with({ api: "Odesli" })

export interface APILinkConverter extends LinkConverter
{
	readonly base_url: URL
	readonly api_key: string
}

export class OdesliMusicConverter extends SimpleLinkConverter implements APILinkConverter
{
	override readonly type: ConversionTypes = ConversionTypes.API;
	readonly base_url: URL = new URL("/v1-alpha.1/links", "https://api.song.link");
	readonly api_key: string = "";

	constructor (name: string, origins: URL[], destinations: URL[], base_url?: URL, api_key?: string)
	{
		super(name, origins, [], destinations)
		if (api_key !== undefined) this.api_key = api_key
		if (base_url !== undefined) this.base_url = new URL(base_url)
	}

	/**
	 * Converts a given link to the destination website, removing query parameters if necessary.
	 * @param link - The link to convert.
	 * @returns The converted link without query parameters.
	 * @throws Error if the link is unsupported or conversion is not needed.
	 */
	public override async convertLink (link: URL): Promise<URL>
	{
		if (this.isSourceSupported(link))
		{
			// console.debug(`Converting link…\n\t${ link }`)
			LOGGER.debug(`Converting link…\n\t${ link }`)
			const originalLinkCleaned: URL = this.cleanLink(link)
			// const cachedLinksFromOriginal: Map<string, string> | undefined = CACHE.getAll(link)
			const cachedLinksFromOriginal: Map<string, string> | undefined = CACHE.getAll(originalLinkCleaned)
			if (cachedLinksFromOriginal?.has(this.defaultDestination.hostname))
			{
				const cachedLink = cachedLinksFromOriginal.get(this.defaultDestination.hostname)
				if (cachedLink) return new URL(cachedLink)
			}

			const requestURL: URL = new URL(this.base_url)
			requestURL.searchParams.append("songIfSingle", "true")
			requestURL.searchParams.append("url", encodeURI(this.cleanLink(link).toString()))

			try
			{
				// console.debug(`Sending request to API…`)
				LOGGER.debug(`Sending request to API…`)
				// console.debug(`\t➥ GET ${ requestURL }`)
				LOGGER.debug(`\t➥ GET ${ requestURL }`)
				const response: OdesliResponse = await (await fetch(requestURL.toString())).json()
				const newLink: URL = new URL(response.pageUrl)
				// console.debug(`\t\t➥ ${ newLink }`)
				LOGGER.debug(`\t\t➥ ${ newLink }`)
				CACHE.add(originalLinkCleaned, newLink)
				return newLink
			} catch (error)
			{
				// console.error(error)
				LOGGER.error(String(error))
				// console.error(`Error with ${ this.name } API, maybe the link doesn't belong to a known song.`)
				LOGGER.error(`Error with API { api }, maybe the link doesn't belong to a known song.`)
				throw new Error("API error")
			}
		} else throw new Error("Unhandled link")
	}
}
