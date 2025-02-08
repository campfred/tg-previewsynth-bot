import { CacheManager } from "../managers/cache.ts"
import { ConversionTypes, LinkConverter } from "../types/types.ts"

const CACHE: CacheManager = CacheManager.Instance

export type SimpleLinkConverterSettings = { expand?: boolean; preserveSearchParams?: string[] }

export class SimpleLinkConverter implements LinkConverter
{
	readonly name: string
	readonly type: ConversionTypes = ConversionTypes.SIMPLE;
	readonly origins: URL[]
	readonly destination: URL
	readonly expand: boolean = true;
	readonly preserveSearchParams: string[] = [];
	enabled: boolean = true;

	/**
	 * Creates a LinkConverter object representing a mapping between links for a website.
	 * @param name Friendly name of the website.
	 * @param origins Original URLs that will be converted.
	 * @param destination Destination URLs for conversions.
	 * @param settings Provides a few settings to fine tune the conversion process. Including disabling expanding links and preserving search parameters.
	 */
	constructor (name: string, origins: URL[], destination: URL, settings?: SimpleLinkConverterSettings)
	{
		this.name = name
		this.origins = origins
		this.destination = destination
		console.debug(`Created ${ this.name } ${ SimpleLinkConverter.name } object that converts to ${ this.destination.hostname } from ${ this.origins.map((origin: URL): string => origin.hostname) }`)
		this.expand = settings?.expand != undefined ? settings.expand : true
		if (!this.expand) console.debug("Link expansion is disabled.")
		if (settings?.preserveSearchParams) this.preserveSearchParams = settings?.preserveSearchParams
		if (this.preserveSearchParams.length > 0) console.debug("Preserving search parameters :", this.preserveSearchParams?.toString())
	}

	/**
	 * Disables the converter.
	 */
	public disable (): void
	{
		this.enabled = false
	}

	/**
	 * Enables the converter.
	 */
	public enable (): void
	{
		this.enabled = true
	}

	/**
	 * Checks if a given link can be handled by this map.
	 * @param link The link to check support for.
	 * @returns True if the link can be handled by this map.
	 */
	public isSupported (link: URL): boolean
	{
		// Gate in case it's disabled
		console.debug("Checking if converter is enabled…")
		console.debug(this.enabled)
		if (!this.enabled) return false

		console.debug("Checking if link is already converted…")
		if (link.hostname === this.destination.hostname) return true

		console.debug("Checking if link path starts with the destination path…")
		console.debug(link.pathname, this.destination.pathname)
		if (link.pathname.startsWith(this.destination.pathname))
		{
			console.debug("Checking if link ends with one of the supported origins…")
			for (const origin of this.origins)
			{
				console.debug(link.hostname, origin.hostname)
				if (link.hostname.endsWith(origin.hostname)) return true
			}
		}

		console.debug("Welp, I don't think it's supported.")
		return false
	}

	/**
	 * filterOutSubdomains
	 * @param link The link to remove subdomains from.
	 * @returns The link with subdomains removed.
	 */
	public static filterOutSubdomains (link: URL): URL
	{
		// if (!this.enabled) throw new Error("Converter is disabled.");
		console.debug(`Filtering out subdomains of link ${ link } …`)
		const filteredUrl: URL = new URL(link)
		const hostnameParts: string[] = filteredUrl.hostname.split(".")
		filteredUrl.hostname = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1]
		console.debug(`Filtered out subdomains of link :\n\t  ${ link }\n\t➥ ${ filteredUrl }`)
		return filteredUrl
	}

	/**
	 * Fetches and expands a given link to the destination website.
	 * @param link The link to expand.
	 * @returns The expanded link.
	 */
	public async expandLink (link: URL): Promise<URL>
	{
		if (!this.expand) return link
		console.debug(`Expanding link ${ link } …`)
		try
		{
			const response: Response = await fetch(link)
			const newLink: URL = new URL(response.url)
			response.body?.cancel()
			console.debug(`Expanded link :\n\t  ${ link }\n\t➥ ${ newLink }`)
			return newLink
		} catch (error)
		{
			console.error("Error while expanding URL :", error)
			throw error
		}
	}

	/**
	 * Removes search params from link.
	 * @param link The link to clean.
	 * @returns The cleaned link.
	 */
	public cleanLink (link: URL): URL
	{
		console.debug(`Cleaning link ${ link } …`)
		const newLink = new URL(link.origin + link.pathname)
		for (const searchParam of this.preserveSearchParams)
		{
			const value: string | null = link.searchParams.get(searchParam)
			if (value != null) newLink.searchParams.append(searchParam, value)
		}
		console.debug(`Cleaned link :\n\t  ${ link }\n\t➥ ${ newLink }`)
		return newLink
	}

	/**
	 * Converts a given link to the destination website, removing query parameters if necessary.
	 * @param link - The link to convert.
	 * @returns The converted link without query parameters.
	 * @throws Error if the link is unsupported or conversion is not needed.
	 */
	public convertLink (link: URL): URL | Promise<URL>
	{
		if (this.isSupported(link))
		{
			// Check if link is already cached and return it if it is
			const cachedLink: URL | undefined = CACHE.get(link)
			if (cachedLink) return cachedLink

			// Convert the link when it's not cached
			console.debug(`Converting link from ${ link } to point to ${ this.destination } …`)
			const newLink = new URL(link)
			newLink.protocol = this.destination.protocol
			newLink.hostname = this.destination.hostname
			newLink.port = this.destination.port
			console.debug(`Converted link :\n\t  ${ link }\n\t➥ ${ newLink }`)
			return newLink
		} else throw Error("Unsupported link")
	}

	/**
	 * Parse a given link.
	 * @param link Link to convert.
	 * @returns Converted link.
	 */
	public async parseLink (link: URL): Promise<URL>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")

		const newLink: URL = await this.convertLink(this.cleanLink(SimpleLinkConverter.filterOutSubdomains(await this.expandLink(link))))
		return newLink
	}
}
