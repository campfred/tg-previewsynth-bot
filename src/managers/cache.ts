import { getLogger, Logger } from "@logtape/logtape"
import { StatsManager } from "./stats.ts"
import { LogCategories } from "./logging.ts"

const STATS: StatsManager = StatsManager.Instance
const LOGGER: Logger = getLogger([LogCategories.BOT, LogCategories.CACHE])

/**
 * Manager that caches URLs after conversion to avoid unecessary requests.
 */
export class CacheManager
{
	private static _Instance: CacheManager
	private _Cache: Map<string, Map<string, string>> = new Map<string, Map<string, string>>()

	private constructor () { }

	static get Instance (): CacheManager { return this._Instance || (this._Instance = new this()) }

	/**
	 * Add URL conversion to cache.
	 * @param origin Origin URL
	 * @param destination Destination URL
	 */
	public add (origin: URL, destination: URL): void
	{
		const originString: string = origin.toString()
		const destinationString: string = destination.toString()
		const logger: Logger = LOGGER.with({ origin: originString, destination: destinationString })

		const destinations: Map<string, string> = this._Cache.get(originString) || new Map<string, string>()
		destinations.set(new URL(destinationString).hostname, destinationString)
		this._Cache.set(originString, destinations)
		// console.debug(`Added ${ originString } to cache as ${ destinationString }`)
		logger.debug("Added { origin } to cache as { destination }")
	}

	/**
	 * Get URL conversion from cache.
	 * @param origin Origin URL
	 * @returns Destination URL
	 */
	public get (origin: URL, destination: URL): string | undefined
	{
		const originString: string = origin.toString()
		const logger: Logger = LOGGER.with({ origin: originString })

		// console.debug(`Cache ${ this._Cache.has(originString) ? "hit" : "miss" } for ${ originString }.`)
		logger.debug(`Cache ${ this._Cache.has(originString) ? "hit" : "miss" } for { origin }.`)
		if (this._Cache.has(originString)) STATS.countCacheHit()
		else STATS.countCacheMiss()

		return this._Cache.get(originString)?.get(destination.toString())
	}

	/**
	 * Get all URL conversions from cache.
	 * @param origin Origin URL
	 * @returns Map of destination URLs
	 */
	public getAll (origin: URL): Map<string, string> | undefined
	{
		const originString: string = origin.toString()
		const logger: Logger = LOGGER.with({ origin: originString })

		// console.debug(`Cache ${ this._Cache.has(originString) ? "hit" : "miss" } for ${ originString }.`)
		logger.debug(`Cache ${ this._Cache.has(originString) ? "hit" : "miss" } for { origin }.`)
		if (this._Cache.has(originString)) STATS.countCacheHit()
		else STATS.countCacheMiss()

		return this._Cache.get(originString)
	}

	/**
	 * Clear the cache.
	 */
	public clear (): void { this._Cache.clear(); STATS.resetCacheStats() }

	/**
	 * Get the cache size.
	 */
	public get size (): number { return this._Cache.size }
}