/**
 * Manager that caches URLs after conversion to avoid unecessary requests.
 */
export class CacheManager
{
	private static _Instance: CacheManager
	private _Cache: Map<URL, URL> = new Map<URL, URL>()

	private constructor () { }

	static get Instance (): CacheManager { return this._Instance || (this._Instance = new this()) }

	/**
	 * Add URL conversion to cache.
	 * @param origin Origin URL
	 * @param destination Destination URL
	 */
	public add (origin: URL, destination: URL): void { this._Cache.set(origin, destination) }

	/**
	 * Get URL conversion from cache.
	 * @param origin Origin URL
	 * @returns Destination URL
	 */
	public get (origin: URL): URL | undefined { return this._Cache.get(origin) }

	/**
	 * Clear the cache.
	 */
	public clear (): void { this._Cache.clear() }

	/**
	 * Get the cache size.
	 */
	public get size (): number { return this._Cache.size }
}