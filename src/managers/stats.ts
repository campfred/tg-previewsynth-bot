import { ConversionTypes, ConversionMethods, LinkConverter } from "../types/types.ts"

export type CommandStats = { [command: string]: number }
export type ConversionMethodStats = { [method: string]: number }
export type ConversionTypeStats = { [type: string]: number }
export type LinkConversionStats = { [converter: string]: number }
export type ConversionStats = [ConversionMethodStats, ConversionTypeStats, LinkConversionStats]
export type ConversionScenarioStats = [number, number, number]

/**
 * Manager that keeps track of a few stats like how many conversions and how many inline queries did it do.
 * It's more for curiosity than anything tbh.
 */
export class StatsManager
{
	private static _Instance: StatsManager
	private _StartTime: Temporal.Instant = Temporal.Now.instant()
	private _Commands: CommandStats = {}
	private _ConversionMethods: ConversionMethodStats = {}
	private _ConversionTypes: ConversionTypeStats = {}
	private _LinkConversions: LinkConversionStats = {}


	private constructor () { }

	/**
	 * Returns instance of StatsManager.
	 */
	static get Instance (): StatsManager { return this._Instance || (this._Instance = new this()) }


	public get StartTime (): Temporal.Instant { return this._StartTime }

	public get UpTime (): Temporal.ComparisonResult { return Temporal.Instant.compare(this._StartTime, Temporal.Now.instant()) }


	/**
	 * Increments the usage stat of a given command.
	 * @param command Command used.
	 */
	public countCommand (command: string): void
	{
		this._Commands[command] ??= 0
		this._Commands[command]++
	}

	/**
	 * Get stats for all the commands.
	 */
	public get CommandsUsage (): CommandStats { return this._Commands }

	/**
	 * Get a given command's usage count.
	 * @param command Desired command to get the usage of
	 * @returns The number of times that command has been used
	 */
	public UsageForCommand (command: string): number { return this._Commands[command] || 0 }

	/**
	 * Counts the link conversions stats based on the given converter.
	 */
	public countConversion (converter: LinkConverter, method: ConversionMethods): void
	{
		this._ConversionMethods[method] ??= 0
		this._ConversionMethods[method]++

		this._ConversionTypes[converter.type] ??= 0
		this._ConversionTypes[converter.type]++

		this._LinkConversions[converter.name] ??= 0
		this._LinkConversions[converter.name]++
	}

	/**
	 * Get stats for all conversion methods.
	 */
	public get ConversionMethodsUsage (): ConversionMethodStats { return this._ConversionMethods }

	/**
	 * Get a given conversion method's usage count.
	 * @param method Desired conversion method to get the usage of
	 * @returns The number of times that method has been used
	 */
	public UsageForConversionMethod (method: ConversionMethods) { return this._ConversionMethods[method] || 0 }

	/**
	 * Get stats for all conversion types.
	 */
	public get ConversionTypeUsage (): ConversionTypeStats { return this._ConversionTypes }

	/**
	 * Get a given conversion type's usage count.
	 * @param type Desired conversion type to get the usage of
	 * @returns The number of times that type has been done
	 */
	public UsageForConversionType (type: ConversionTypes): number { return this._ConversionTypes[type] || 0 }

	/**
	 * Get stats for all conversion links.
	 */
	public get LinkConversionUsage (): LinkConversionStats { return this._LinkConversions }

	/**
	 * Get a given link converter's usage count.
	 * @param converter Desired link converter to get the usage of
	 * @returns The number of times that converter has been used
	 */
	public UsageForLinkConversion (converter: LinkConverter): number { return this._LinkConversions[converter.name] || 0 }

	/**
	 * Get all the conversion stats.
	 */
	public get ConversionsUsage (): ConversionStats { return [this._ConversionMethods, this._ConversionTypes, this._LinkConversions] }

	public UsageForConversionScenario (method: ConversionMethods, type: ConversionTypes, converter: LinkConverter): ConversionScenarioStats { return [this._ConversionMethods[method] || 0, this._ConversionTypes[type] || 0, this._LinkConversions[converter.name] || 0] }
}