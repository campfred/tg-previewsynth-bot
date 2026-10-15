import { CacheManager } from "../managers/cache.ts"
import { SimpleLinkConverter, SimpleLinkConverterSettings } from "./simple.ts"

const CACHE: CacheManager = CacheManager.Instance

/**
 * Converts links by placing them into a resolver URL and following its redirect.
 */
export class RedirectLinkConverter extends SimpleLinkConverter
{
	readonly redirectUrlTemplate: string

	constructor (name: string, origins: URL[], originsRegExp: RegExp[], destinations: URL[], settings?: SimpleLinkConverterSettings)
	{
		super(name, origins, originsRegExp, destinations, settings)
		if (!settings?.redirectUrlTemplate || settings.redirectUrlTemplate.split("{url}").length !== 2)
			throw new Error("Redirect URL template must contain exactly one {url} placeholder.")

		this.redirectUrlTemplate = settings.redirectUrlTemplate
		const resolverUrl = new URL(this.redirectUrlTemplate.replace("{url}", "https%3A%2F%2Fexample.com"))
		if (resolverUrl.protocol !== "http:" && resolverUrl.protocol !== "https:")
			throw new Error("Redirect URL template must use HTTP or HTTPS.")
	}

	public override isSourceSupported (link: URL): boolean
	{
		if (!this.enabled) return false
		const isDestination = this.destinations.some(destination =>
			link.hostname === destination.hostname || link.hostname.endsWith(`.${ destination.hostname }`))
		return isDestination || super.isSourceSupported(link)
	}

	public override async convertLink (link: URL, _destination: URL): Promise<URL>
	{
		if (!this.isSourceSupported(link)) throw new Error("Incompatible link")

		const isAlreadyResolved = this.destinations.some(destination =>
			link.hostname === destination.hostname || link.hostname.endsWith(`.${ destination.hostname }`))
		if (isAlreadyResolved) return link

		const originalLinkCleaned = this.cleanLink(link)
		const cachedLinks = CACHE.getAll(originalLinkCleaned)
		for (const destination of this.destinations)
		{
			const cachedLink = cachedLinks?.get(destination.hostname)
			if (cachedLink) return new URL(cachedLink)
		}

		const resolverUrl = new URL(this.redirectUrlTemplate.replace("{url}", encodeURIComponent(link.toString())))
		const resolvedLink = await this.expandLink(resolverUrl, true)
		const isAllowedDestination = this.destinations.some(destination =>
			resolvedLink.protocol === destination.protocol &&
			(resolvedLink.hostname === destination.hostname || resolvedLink.hostname.endsWith(`.${ destination.hostname }`)))
		if (!isAllowedDestination)
			throw new Error(`Resolver returned an unsupported destination: ${ resolvedLink }`)

		CACHE.add(originalLinkCleaned, resolvedLink)
		return resolvedLink
	}

	public override async parseLink (link: URL): Promise<URL[]>
	{
		return [await this.parseLinkDefault(link)]
	}
}
