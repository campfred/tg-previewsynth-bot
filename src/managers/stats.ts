import { ConversionTypes, ConversionMethods, LinkConverter } from "../types/types.ts"

/**
 * Manager that keeps track of a few stats like how many conversions and how many inline queries did it do.
 * It's more for curiosity than anything tbh.
 */
export class StatsManager
{
	private static _Instance: StatsManager
	private _StartTime: Temporal.Instant = Temporal.Now.instant()
	private _Commands: Map<string, number> = new Map<string, number>()
	private _Conversions: Map<ConversionMethods, Map<ConversionTypes, Map<LinkConverter, number>>> = new Map<ConversionMethods, Map<ConversionTypes, Map<LinkConverter, number>>>()
	private _ConversionMethods: Map<string, number> = new Map<string, number>()
	private _ConversionTypes: Map<string, number> = new Map<string, number>()
	private _LinkConversions: Map<string, number> = new Map<string, number>()
	private _CacheHits: number = 0
	private _CacheMisses: number = 0

	private constructor () { }

	/**
	 * Returns instance of StatsManager.
	 */
	static get Instance (): StatsManager { return this._Instance || (this._Instance = new this()) }


	public get StartTime (): Temporal.Instant { return this._StartTime }

	public get UpTime (): Temporal.Duration { return Temporal.Now.instant().since(this._StartTime) }


	/**
	 * Increments the usage stat of a given command.
	 * @param command Command used.
	 */
	public countCommand (command: string): void { this._Commands.set(command, (this._Commands.get(command) || 0) + 1) }

	/**
	 * Get stats for all the commands.
	 */
	public get CommandsUsage (): Map<string, number> { return this._Commands }

	/**
	 * Get a given command's usage count.
	 * @param command Desired command to get the usage of
	 * @returns Number of times that command has been used
	 */
	public UsageForCommand (command: string): number { return this._Commands.get(command) || 0 }

	/**
	 * Counts the link conversions stats based on the given converter.
	 */
	public countConversion (converter: LinkConverter, method: ConversionMethods): void
	{
		this._Conversions.set(method, this._Conversions.get(method) || new Map<ConversionTypes, Map<LinkConverter, number>>())
		this._Conversions.get(method)?.set(converter.type, this._Conversions.get(method)?.get(converter.type) || new Map<LinkConverter, number>())
		this._Conversions.get(method)?.get(converter.type)?.set(converter, (this._Conversions.get(method)?.get(converter.type)?.get(converter) || 0) + 1)

		this._ConversionMethods.set(method, (this._ConversionMethods.get(method) || 0) + 1)
		this._ConversionTypes.set(converter.type, (this._ConversionTypes.get(converter.type) || 0) + 1)
		this._LinkConversions.set(converter.name, (this._LinkConversions.get(converter.name) || 0) + 1)
	}

	/**
	 * Get stats for all conversion methods.
	 */
	public get ConversionMethodsUsage (): Map<string, number> { return this._ConversionMethods }

	/**
	 * Get a given conversion method's usage count.
	 * @param method Desired conversion method to get the usage of
	 * @returns Number of times that method has been used
	 */
	public UsageForConversionMethod (method: ConversionMethods): number { return this._ConversionMethods.get(method) || 0 }

	/**
	 * Get stats for all conversion types.
	 */
	public get ConversionTypeUsage (): Map<string, number> { return this._ConversionTypes }

	/**
	 * Get a given conversion type's usage count.
	 * @param type Desired conversion type to get the usage of
	 * @returns Number of times that type has been done
	 */
	public UsageForConversionType (type: ConversionTypes): number { return this._ConversionTypes.get(type) || 0 }

	/**
	 * Get stats for all conversion links.
	 */
	public get LinkConversionUsage (): Map<string, number> { return this._LinkConversions }

	/**
	 * Get a given link converter's usage count.
	 * @param converter Desired link converter to get the usage of
	 * @returns Number of times that converter has been used
	 */
	public UsageForLinkConversion (converter: LinkConverter): number { return this._LinkConversions.get(converter.name) || 0 }

	/**
	 * Get all the conversion stats.
	 */
	public get ConversionsUsage (): [Map<string, number>, Map<string, number>, Map<string, number>] { return [this._ConversionMethods, this._ConversionTypes, this._LinkConversions] }

	/**
	 * Get a given conversion scenario's usage count.
	 * @param method Desired conversion method to get the usage of
	 * @param type Desired conversion type to get the usage of
	 * @param converter Desired link converter to get the usage of
	 * @returns Number of times the given scenario has been done
	 */
	public UsageForConversionScenario (method: ConversionMethods, type: ConversionTypes, converter: LinkConverter): number { return this._Conversions.get(method)?.get(type)?.get(converter) || 0 }

	/**
	 * Increments the cache hit stat.
	 */
	public countCacheHit (): void { this._CacheHits++ }

	/**
	 * Get the cache hit count.
	 */
	public get CacheHits (): number { return this._CacheHits }

	/**
	 * Increments the cache miss stat.
	 */
	public countCacheMiss (): void { this._CacheMisses++ }

	/**
	 * Get the cache miss count.
	 */
	public get CacheMisses (): number { return this._CacheMisses }

	/**
	 * Get the cache hit ratio.
	 */
	public get CacheHitRatio (): number { return this._CacheHits / (this._CacheHits + this._CacheMisses) }

	/**
	 * Get the cache miss ratio.
	 */
	public get CacheMissRatio (): number { return this._CacheMisses / (this._CacheHits + this._CacheMisses) }

	/**
	 * Clear cache stats.
	 */
	public resetCacheStats (): void { this._CacheHits = 0; this._CacheMisses = 0 }
}