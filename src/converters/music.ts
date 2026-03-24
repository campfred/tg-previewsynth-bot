import { getLogger, Logger } from "@logtape/logtape"
import { CacheManager } from "../managers/cache.ts"
import { ConversionTypes, LinkConverter, OdesliConfiguration, OdesliCountryCode } from "../types/types.ts"
import { SimpleLinkConverter } from "./simple.ts"
import { LogCategories } from "../managers/logging.ts"
import Odesli from "odesli.js"
import { OdesliDestinationsURLs, OdesliOriginsURLs } from "../types/odesli.ts"

const CACHE: CacheManager = CacheManager.Instance
const LOGGER: Logger = getLogger([LogCategories.BOT, LogCategories.APIS]).with({ api: "Odesli" })

export class OdesliMusicConverter extends SimpleLinkConverter implements LinkConverter
{
	override readonly type: ConversionTypes = ConversionTypes.API;
	readonly odesli: Odesli
	readonly country: OdesliCountryCode

	constructor (config?: OdesliConfiguration)
	{
		super("Odesli", OdesliOriginsURLs, [], OdesliDestinationsURLs)
		const defaultCountry: OdesliCountryCode = Odesli.getCountryOptions()[0].code
		this.country = config?.country && Odesli.getCountryOptions().some(opt => opt.code === config.country)
			? config.country as OdesliCountryCode
			: defaultCountry
		LOGGER.debug(`Using country ${ this.country } for Odesli API requests.`)
		this.odesli = new Odesli({
			...(Deno.env.get("ODESLI_API_KEY") && { apiKey: Deno.env.get("ODESLI_API_KEY") }) // Set the apiKey property only when the environment variable is set to avoid issues with the constructor validation
		})
	}

	public getSupportedLinks (): URL[]
	{
		return this.origins
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
			LOGGER.debug(`Converting link…\n\t${ link }`)
			const originalLinkCleaned: URL = this.cleanLink(link)
			const cachedLinksFromOriginal: Map<string, string> | undefined = CACHE.getAll(originalLinkCleaned)
			if (cachedLinksFromOriginal?.has(this.defaultDestination.hostname))
				return new URL(cachedLinksFromOriginal.get(this.defaultDestination.hostname)!)

			try
			{
				LOGGER.debug(`Sending request to API…`)
				const song = await this.odesli.fetch(link.toString(), { country: this.country })

				const parsedSong = Array.isArray(song) ? song[0] : song
				const pageUrl = parsedSong && typeof parsedSong === "object" && "pageUrl" in parsedSong
					? (parsedSong as { pageUrl: string }).pageUrl
					: undefined

				if (!pageUrl)
					throw new Error("Odesli API response does not contain a pageUrl")

				const newLink: URL = new URL(pageUrl)
				LOGGER.debug(`\t${ newLink }`)
				CACHE.add(originalLinkCleaned, newLink)
				return newLink
			} catch (error)
			{
				LOGGER.error(String(error))
				LOGGER.error(`Error with API ${ this.name }, maybe the service is having issues.`)
				throw new Error("API error")
			}
		} else throw new Error("Unhandled link")
	}
}
