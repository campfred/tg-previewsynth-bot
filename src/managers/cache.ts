import { StatsManager } from "./stats.ts"

const STATS: StatsManager = StatsManager.Instance

/**
 * Manager that caches URLs after conversion to avoid unecessary requests.
 */
export class CacheManager
{
	private static _Instance: CacheManager
	private _Cache: Map<string, string> = new Map<string, string>()

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

		this._Cache.set(originString, destinationString)
		console.debug(`Added ${ originString } to cache as ${ destinationString }`)
	}

	/**
	 * Get URL conversion from cache.
	 * @param origin Origin URL
	 * @returns Destination URL
	 */
	public get (origin: URL): string | undefined
	{
		const originString: string = origin.toString()

		console.debug(`Cache ${ this._Cache.has(originString) ? "hit" : "miss" } for ${ originString }.`)
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