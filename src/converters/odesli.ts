import { getLogger, Logger } from "@logtape/logtape"
import { CacheManager } from "../managers/cache.ts"
import { ConversionTypes, LinkConverter, OdesliConfiguration, OdesliCountryCode } from "../types/types.ts"
import { SimpleLinkConverter } from "./simple.ts"
import { LogCategories } from "../managers/logging.ts"
import Odesli from "odesli.js"
import { OdesliDestinationsURLs, OdesliOriginsURLs } from "../types/odesli.ts"

const CACHE: CacheManager = CacheManager.Instance
const LOGGER: Logger = getLogger([LogCategories.BOT, LogCategories.APIS]).with({ api: "Odesli" })

/**
 * Extracts an HTTP status code from an odesli.js error message, e.g.
 * "HTTP 400: Bad Request" or "400: <code>, Codes in the 4xx range…".
 * @param message Error message to parse.
 * @returns The parsed status code, or `undefined` if none could be found.
 */
function extractHttpStatusCode (message: string): number | undefined
{
	const match: RegExpMatchArray | null = message.match(/\b([1-5]\d{2})\b/)
	return match ? Number(match[1]) : undefined
}

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
			...(Deno.env.get("ODESLI_API_KEY") && { apiKey: Deno.env.get("ODESLI_API_KEY") }), // Set the apiKey property only when the environment variable is set to avoid issues with the constructor validation
			metrics: false // Disable Odesli internal metrics interval to avoid Deno leak warnings in tests, it's not like I'm using the metrics feature anyway
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
				const statusCode: number | undefined = extractHttpStatusCode(String(error))

				// Client errors (4xx) mean the link itself is invalid/unrecognized by Odesli,
				// not that the service is having issues. Don't spam the status chat for those.
				if (statusCode !== undefined && statusCode >= 400 && statusCode < 500)
				{
					LOGGER.debug(`Odesli rejected link as invalid/unrecognized (HTTP ${ statusCode }): ${ String(error) }`)
					throw new Error("Invalid or unrecognized link")
				}

				LOGGER.error(String(error))
				LOGGER.error(`Error with API ${ this.name }, maybe the service is having issues.`)
				throw new Error("API error")
			}
		} else throw new Error("Unhandled link")
	}

	/**
	 * Parse a given link via a specific destination.
	 * @param link Link to convert.
	 * @param destination Destination URL to convert the link to.
	 * @returns Converted link.
	 * @throws Error if the link is unsupported or conversion is not needed.
	 */
	public override parseLinkDefault (link: URL): Promise<URL>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")

		LOGGER.debug(`Parsing link (default) ${ link }`)
		return this.convertLink(link)
	}

	/**
	 * Parse a given link and return only the default destination URL.
	 * Odesli always returns a single song.link URL, not multiple alternatives.
	 * @param link Link to convert.
	 * @returns Array with a single converted link.
	 * @throws Error if the link is unsupported or conversion fails.
	 */
	public override async parseLink (link: URL): Promise<URL[]>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")

		LOGGER.debug(`Parsing link ${ link }`)
		if (this.isSourceSupported(link))
		{
			const convertedLink: URL = await this.convertLink(link)
			return [convertedLink]
		} else throw Error("Unsupported link")
	}
}
