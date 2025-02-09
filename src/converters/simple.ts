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
		console.debug(`Created ${ this.name } ${ SimpleLinkConverter.name }`)
		console.debug(`\t➥ ${ this.origins.map((origin: URL): string => origin.hostname) } → ${ this.destination.hostname }`)
		this.expand = settings?.expand != undefined ? settings.expand : true
		if (!this.expand) console.debug("\t➥ Link expansion is disabled.")
		if (settings?.preserveSearchParams) this.preserveSearchParams = settings?.preserveSearchParams
		if (this.preserveSearchParams.length > 0) console.debug("\t➥ Preserving search parameters :", this.preserveSearchParams?.toString())
	}

	/**
	 * Disables the converter.
	 */
	public disable (): void { this.enabled = false }

	/**
	 * Enables the converter.
	 */
	public enable (): void { this.enabled = true }

	/**
	 * Toggles the converter.
	 */
	public toggle (): void { this.enabled = !this.enabled }

	/**
	 * Sets the converter's state.
	 * @param state The state to set.
	 */
	public setEnabled (state: boolean): void { this.enabled = state }

	/**
	 * Checks if a given link can be handled by this map.
	 * @param link The link to check support for.
	 * @returns True if the link can be handled by this map.
	 */
	public isSupported (link: URL): boolean
	{
		console.debug(`Checking if link is supported by converter for ${ this.name } …`)

		// Gate in case it's disabled
		console.debug("Checking if converter is enabled…" + this.enabled)
		if (!this.enabled) return false

		const isAlreadyConverted: boolean = link.hostname === this.destination.hostname
		console.debug("Checking if link is already converted…" + isAlreadyConverted)
		if (isAlreadyConverted) return true

		console.debug("Checking if link path starts with the destination path…", link.pathname, this.destination.pathname)
		if (link.pathname.startsWith(this.destination.pathname))
		{
			console.debug("Checking if link ends with one of the supported origins…")
			for (const origin of this.origins)
			{
				const endsWithSupportedOrigin: boolean = link.hostname.endsWith(origin.hostname)
				console.debug("\t➥ " + origin.hostname, endsWithSupportedOrigin)
				if (endsWithSupportedOrigin) return true
			}
		}

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
		console.debug(`Filtering out subdomains of link…\n\t${ link }`)
		const filteredUrl: URL = new URL(link)
		const hostnameParts: string[] = filteredUrl.hostname.split(".")
		filteredUrl.hostname = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1]
		console.debug(`\t➥ ${ filteredUrl }`)
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
		console.debug(`Expanding link …\n\t${ link }`)
		try
		{
			const response: Response = await fetch(link)
			const newLink: URL = new URL(response.url)
			response.body?.cancel()
			console.debug(`\t➥ ${ newLink }`)
			return newLink
		} catch (error)
		{
			console.error(error)
			console.error("Error while expanding URL.")
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
		console.debug(`Cleaning link…\n\t${ link }`)
		const newLink = new URL(link.origin + link.pathname)
		for (const searchParam of this.preserveSearchParams)
		{
			const value: string | null = link.searchParams.get(searchParam)
			if (value != null) newLink.searchParams.append(searchParam, value)
		}
		console.debug(`\t➥ ${ newLink }`)
		return newLink
	}

	/**
	 * Converts a given link to the destination website, removing query parameters if necessary.
	 * @param link - The link to convert.
	 * @returns The converted link without query parameters.
	*/
	public convertLink (link: URL): URL | Promise<URL>
	{
		console.debug(`Converting link…\n\t${ link }`)

		const newLink = new URL(link)
		newLink.protocol = this.destination.protocol
		newLink.hostname = this.destination.hostname
		newLink.port = this.destination.port
		console.debug(`\t➥ ${ newLink }`)

		return newLink
	}

	/**
	 * Parse a given link.
	 * @param link Link to convert.
	 * @returns Converted link.
	 * @throws Error if the link is unsupported or conversion is not needed.
	*/
	public async parseLink (link: URL): Promise<URL>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")
		if (!this.isSupported(link)) throw Error("Unsupported link")

		const originalLinkCleaned: URL = this.cleanLink(link)
		const cachedLinkFromOriginal: string | undefined = CACHE.get(originalLinkCleaned)
		if (cachedLinkFromOriginal) return new URL(cachedLinkFromOriginal)

		const originalLinkExpanded: URL = await this.expandLink(originalLinkCleaned)
		const cachedLinkFromExpanded: string | undefined = CACHE.get(originalLinkExpanded)
		if (cachedLinkFromExpanded) return new URL(cachedLinkFromExpanded)

		const convertedLink: URL = await this.convertLink(originalLinkExpanded)
		CACHE.add(originalLinkCleaned, convertedLink)
		CACHE.add(originalLinkExpanded, convertedLink)
		return convertedLink
	}
}
