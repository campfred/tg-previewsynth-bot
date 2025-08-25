import { getLogger, Logger } from "@logtape/logtape"
import { CacheManager } from "../managers/cache.ts"
import { ConversionTypes, LinkConverter } from "../types/types.ts"
import { LogCategories } from "../managers/logging.ts"

const CACHE: CacheManager = CacheManager.Instance
const LOGGER: Logger = getLogger([LogCategories.BOT, LogCategories.LINKS])

export type SimpleLinkConverterSettings = { expand?: boolean; preserveQueryParamKeys?: string[] }

export class SimpleLinkConverter implements LinkConverter
{
	readonly name: string
	readonly type: ConversionTypes = ConversionTypes.SIMPLE;
	readonly origins: URL[]
	readonly originRegExps: RegExp[]
	readonly destinations: URL[]
	readonly defaultDestination: URL
	readonly expand: boolean = true;
	readonly preserveQueryParamKeys: string[] = [];
	enabled: boolean = true;

	/**
	 * Creates a LinkConverter object representing a mapping between links for a website.
	 * @param name Friendly name of the website.
	 * @param origins Original URLs that will be converted.
	 * @param destination Destination URLs for conversions.
	 * @param settings Provides a few settings to fine tune the conversion process. Including disabling expanding links and preserving search parameters.
	 */
	constructor (name: string, origins: URL[], originsRegExp: RegExp[], destinations: URL[], settings?: SimpleLinkConverterSettings)
	{
		this.name = name
		this.origins = origins
		this.originRegExps = originsRegExp
		this.destinations = destinations
		this.defaultDestination = destinations[0]
		// console.debug(`\t➥ Created ${ this.name } ${ this.constructor.name }!`)
		LOGGER.debug(`\t➥ Created ${ this.name } ${ this.constructor.name }!`)
		// console.debug(`\t\t➥ ${ this.origins.map((origin: URL): string => origin.hostname) } → ${ this.destinations[0].hostname }`)
		// LOGGER.debug(`\t\t➥ ${ this.origins.map((origin: URL): string => origin.hostname) } → ${ this.destinations[0].hostname }`)
		this.expand = settings?.expand != undefined ? settings.expand : true
		// if (!this.expand) console.debug("\t➥ Link expansion is disabled.")
		if (!this.expand) LOGGER.debug("\t➥ Link expansion is disabled.")
		if (settings?.preserveQueryParamKeys) this.preserveQueryParamKeys = settings?.preserveQueryParamKeys
		// if (this.preserveQueryParamKeys.length > 0) console.debug("\t➥ Preserving search parameters :", this.preserveQueryParamKeys?.toString())
		if (this.preserveQueryParamKeys.length > 0) LOGGER.debug("\t➥ Preserving search parameters : " + this.preserveQueryParamKeys?.toString())
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
	 * Finds matching origin URLs for a given link. Array will be empty if no origin matches the link.
	 * @param link Link URL to find matching origin URLs for
	 * @returns Array of matching origin URLs
	 */
	private findMatchingOrigin (link: URL): URL | undefined
	{
		for (const origin of this.origins) if (link.hostname.endsWith(origin.hostname) && link.pathname.startsWith(origin.pathname)) return origin
		return undefined
	}

	/**
	 * Finds matching origin patterns for a given link. Array will be empty if no origin regex matches the link.
	 * @param link Link URL to find matching origin patterns for
	 * @returns Array of matching origin regular expressions
	 */
	private findMatchingOriginRegExp (link: URL): RegExp | undefined
	{
		for (const originRegExp of this.originRegExps) if (originRegExp.test(link.toString())) return originRegExp
		return undefined
	}

	/**
	 * Checks if a given link can be handled by this map.
	 * @param link The link to check support for.
	 * @returns True if the link can be handled by this map.
	 */
	public isSourceSupported (link: URL): boolean
	{
		if (!this.enabled) return false // Gate in case it's disabled

		// console.debug(`Checking if link is supported by converter for ${ this.name }…`)
		LOGGER.debug(`Checking if link is supported by converter for ${ this.name }…`)

		const isAlreadyConverted: boolean = link.hostname === this.destinations[0].hostname
		// console.debug("\t➥ Link is already converted :", isAlreadyConverted)
		LOGGER.debug("\t➥ Link is already converted : " + isAlreadyConverted)
		if (isAlreadyConverted) { return true }


		const hasMatchingOrigin: boolean = this.findMatchingOrigin(link) != undefined
		// console.debug("\t➥ Link matches one of the supported origin URLs :", hasMatchingOrigin)
		LOGGER.debug("\t➥ Link matches one of the supported origin URLs : " + hasMatchingOrigin)
		if (hasMatchingOrigin) return true

		const hasMatchingOriginRegExp: boolean = this.findMatchingOriginRegExp(link) != undefined
		// console.debug("\t➥ Link matches one of the supported origin patterns :", hasMatchingOriginRegExp)
		LOGGER.debug("\t➥ Link matches one of the supported origin patterns : " + hasMatchingOriginRegExp)
		if (hasMatchingOriginRegExp) return true

		return false
	}

	/**
	 * Checks if a given destination URL is part of the converter's possible destinations.
	 * @param destination The destination URL to check.
	 * @returns True if the destination URL is part of the available destinations.
	 */
	public isDestinationSupported (link: URL): boolean
	{
		if (!this.enabled) return false // Gate in case it's disabled

		// console.debug(`Checking if destination is supported by converter for ${ this.name }…`)
		LOGGER.debug(`Checking if destination is supported by converter for ${ this.name }…`)

		const hasMatchingDestination: boolean = this.destinations.some((destination: URL): boolean => destination.hostname.endsWith(link.hostname))
		// console.debug("\t➥ Link matches one of the supported destination URLs :", hasMatchingDestination)
		LOGGER.debug("\t➥ Link matches one of the supported destination URLs : " + hasMatchingDestination)
		return hasMatchingDestination
	}

	/**
	 * filterOutSubdomains
	 * @param link The link to remove subdomains from.
	 * @returns The link with subdomains removed.
	 */
	public static filterOutSubdomains (link: URL): URL
	{
		// if (!this.enabled) throw new Error("Converter is disabled.");
		// console.debug(`Filtering out subdomains of link…\n\t${ link }`)
		LOGGER.debug(`Filtering out subdomains of link…\n\t${ link }`)
		const filteredUrl: URL = new URL(link)
		const hostnameParts: string[] = filteredUrl.hostname.split(".")
		filteredUrl.hostname = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1]
		// console.debug(`\t➥ ${ filteredUrl }`)
		LOGGER.debug(`\t➥ ${ filteredUrl }`)
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
		// console.debug(`Expanding link …\n\t${ link }`)
		LOGGER.debug(`Expanding link …\n\t${ link }`)
		try
		{
			let response: Response = await fetch(link)
			let newLink: URL = new URL(response.url)
			response.body?.cancel()
			while (response.redirected)
			{
				// console.debug(`\t➥ ${ response.url }`)
				LOGGER.debug(`\t➥ ${ response.url }`)
				response = await fetch(newLink)
				newLink = new URL(response.url)
				response.body?.cancel()
			}
			// console.debug(`\t➥ ${ newLink }`)
			LOGGER.debug(`\t➥ ${ newLink }`)
			return newLink
		} catch (error)
		{
			LOGGER.error("Error while expanding URL.")
			// console.error(error)
			LOGGER.error(String(error))
			// console.error("Error while expanding URL.")
			LOGGER.error("Error while expanding URL.")
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
		// console.debug(`Cleaning link…\n\t${ link }`)
		LOGGER.debug(`Cleaning link…\n\t${ link }`)
		const newLink = new URL(link.origin + link.pathname)
		for (const searchParam of this.preserveQueryParamKeys)
		{
			const value: string | null = link.searchParams.get(searchParam)
			if (value != null) newLink.searchParams.append(searchParam, value)
		}
		// console.debug(`\t➥ ${ newLink }`)
		LOGGER.debug(`\t➥ ${ newLink }`)
		return newLink
	}

	/**
	 * Converts a given link to the destination website, removing query parameters if necessary.
	 * @param link - The link to convert.
	 * @returns The converted link without query parameters.
	*/
	public convertLink (link: URL, destination: URL): URL | Promise<URL>
	{
		// console.debug(`Converting link…\n\t${ link }`)
		LOGGER.debug(`Converting link…\n\t${ link }`)

		const matchingOrigin: URL | undefined = this.findMatchingOrigin(link)
		if (matchingOrigin)
		{
			const newLink = new URL(link)
			newLink.protocol = destination.protocol
			newLink.hostname = destination.hostname
			newLink.port = destination.port
			// console.debug(`\t➥ ${ newLink }`)
			LOGGER.debug(`\t➥ ${ newLink }`)

			return newLink
		}

		const matchesOriginRegExp: RegExp | undefined = this.findMatchingOriginRegExp(link)
		if (matchesOriginRegExp)
		{
			const newLink = new URL(link.toString().replace(matchesOriginRegExp, destination.toString())) // This is not working at the moment.
			// console.debug(`\t➥ ${ newLink }`)
			LOGGER.debug(`\t➥ ${ newLink }`)

			return newLink
		}

		throw new Error("Incompatible link")
	}

	/**
	 * Parse a given link.
	 * @param link Link to convert.
	 * @param destination Destination URL to convert the link to.
	 * @returns Converted link.
	 * @throws Error if the link is unsupported or conversion is not needed.
	*/
	public async parseLink (link: URL): Promise<URL[]>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")

		// console.debug(`Parsing link ${ link }`)
		LOGGER.debug(`Parsing link ${ link }`)
		if (this.isSourceSupported(link))
		{
			const originalLinkCleaned: URL = this.cleanLink(link)
			const cachedLinksFromOriginal: Map<string, string> | undefined = CACHE.getAll(originalLinkCleaned)
			if (cachedLinksFromOriginal && cachedLinksFromOriginal.size === this.destinations.length) return cachedLinksFromOriginal.values().toArray().map((link: string): URL => new URL(link))

			const originalLinkExpanded: URL = this.cleanLink(await this.expandLink(originalLinkCleaned))
			const cachedLinksFromExpanded: Map<string, string> | undefined = CACHE.getAll(originalLinkExpanded)
			if (cachedLinksFromExpanded && cachedLinksFromExpanded.size === this.destinations.length) return cachedLinksFromExpanded.values().toArray().map((link: string): URL => new URL(link))

			const convertedLinks: URL[] = []
			for (const destination of this.destinations)
			{
				const convertedLink: URL = await this.convertLink(originalLinkExpanded, destination)
				CACHE.add(originalLinkCleaned, convertedLink)
				CACHE.add(originalLinkExpanded, convertedLink)
				convertedLinks.push(convertedLink)
			}
			return convertedLinks
		} else throw Error("Unsupported link")
	}

	/**
	 * Parse a given link via a specific destination.
	 * @param link Link to convert.
	 * @param destination Destination URL to convert the link to.
	 * @returns Converted link.
	 * @throws Error if the link is unsupported or conversion is not needed.
	*/
	public async parseLinkViaDestination (link: URL, destination: URL): Promise<URL>
	{
		if (!this.enabled) throw new Error("Converter is disabled.")

		// console.debug(`Parsing link ${ link }`)
		LOGGER.debug(`Parsing link ${ link }`)
		if (this.isSourceSupported(link))
		{
			const originalLinkCleaned: URL = this.cleanLink(link)
			const cachedLinkFromOriginal: string | undefined = CACHE.get(originalLinkCleaned, destination)
			if (cachedLinkFromOriginal) return new URL(cachedLinkFromOriginal)

			const originalLinkExpanded: URL = this.cleanLink(await this.expandLink(originalLinkCleaned))
			const cachedLinkFromExpanded: string | undefined = CACHE.get(originalLinkExpanded, destination)
			if (cachedLinkFromExpanded) return new URL(cachedLinkFromExpanded)

			const convertedLink: URL = await this.convertLink(originalLinkExpanded, destination)
			CACHE.add(originalLinkCleaned, convertedLink)
			CACHE.add(originalLinkExpanded, convertedLink)
			return convertedLink
		} else throw Error("Unsupported link")
	}

	/**
	 * Parse a given link with the default destination.
	 * @param link Link to convert.
	 * @returns Converted link.
	 * @throws Error if the link is unsupported or conversion is not needed.
	*/
	public async parseLinkDefault (link: URL): Promise<URL>
	{
		return await this.parseLinkViaDestination(link, this.defaultDestination)
	}
}
