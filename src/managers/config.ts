import { parse, stringify } from "@std/yaml"
import { AboutConfiguration, APIConfiguration, APIsConfiguration, Configuration, FeaturesConfiguration, LinkConfiguration, LinkConverter } from "../types/types.ts"
import { SimpleLinkConverter } from "../converters/simple.ts"
import { APILinkConverter, OdesliMusicConverter } from "../converters/music.ts"
import { OdesliOrigins } from "../types/odesli.ts"
import { UserFromGetMe } from "x/grammy_types/manage"

const PATH_CONFIG_FILE: string = Deno.env.get("PREVIEWSYNTH_CONFIG_FILE_PATH") || Deno.env.get("previewsynth_config_file_path") || "config.yaml"

/**
 * Manager that handles everything related to the configuration including loading and saving it.
 */
export class ConfigurationManager
{
	private static _Instance: ConfigurationManager
	private _SimpleConverters: SimpleLinkConverter[] = [];
	private _APIConverters: APILinkConverter[] = [];
	private _Features!: FeaturesConfiguration
	private _About!: AboutConfiguration
	private _BotInfo!: UserFromGetMe

	/**
	 * Get the instance of the config manager.
	 */
	static get Instance (): ConfigurationManager { return this._Instance || (this._Instance = new this()) }

	/**
	 * Sets the bot's informations from Telegram.
	 */
	set BotInfo (botInfo: UserFromGetMe) { this._BotInfo = botInfo }

	/**
	 * Returns the bot's informations that was previously obtained from Telegram.
	 */
	get BotInfo (): UserFromGetMe { return this._BotInfo }

	/**
	 * Returns the chat ID where the bot sends status updates.
	 */
	get StatusUpdatesChatID (): number { return this._About.status_updates ? this._About.status_updates.chat : this._About.owner }

	/**
	 * Returns the topic ID where the bot sends status updates.
	 */
	get StatusUpdatesTopicID (): number | undefined { return this._About.status_updates?.topic }

	/**
	 * Returns the message options to send status updates in the right topic.
	 */
	get StatusUpdatesMessagesOptions (): { message_thread_id?: number } { return this.StatusUpdatesTopicID ? { message_thread_id: this.StatusUpdatesTopicID } : {} }

	/**
	 * Returns the simple link converters currently handled.
	 */
	get SimpleConverters (): SimpleLinkConverter[] { return this._SimpleConverters }

	/**
	 * Returns the API-based converters currently handled.
	 */
	get APIConverters (): APILinkConverter[] { return this._APIConverters }

	/**
	 * Returns all of the converters currently handled.
	 */
	get AllConverters (): LinkConverter[] { return [...this._SimpleConverters, ...this._APIConverters] }

	/**
	 * Returns the current configuration for features.
	 */
	get Features (): FeaturesConfiguration { return this._Features }

	/**
	 * Returns the current configuration about the bot's service.
	 */
	get About (): AboutConfiguration { return this._About }

	/**
	 * Processes link conversion configs into link converters.
	 * @param links Simple link conversion configurations to process
	 * @returns Link converters
	 */
	private parseSimpleConvertersInConfig (links: LinkConfiguration[]): SimpleLinkConverter[]
	{
		console.debug("Loading links configuration…")

		const converters: SimpleLinkConverter[] = links.map(function (link: LinkConfiguration): SimpleLinkConverter
		{
			// Handle missing links that has zero origins set
			if (!("origins" in link) && !("origins_regex" in link)) throw new Error("No origin set in link config")

			// console.debug(`Creating ${ SimpleLinkConverter.name } config for ${ link.name } …`)

			const converter = new SimpleLinkConverter(
				link.name.trim(),
				"origins" in link ? link.origins.map((origin: string) => new URL(origin.trim())) : [],
				"origins_regex" in link ? link.origins_regex.map((originRegExpString: string) => new RegExp(originRegExpString.trim(), "i")) : [],
				new URL(link.destination.trim()),
				link.settings,
			)
			converter.setEnabled(link.enabled || true)

			return converter
		})

		console.info(`\t➥ ${ converters.length } link converters`)
		return converters
	}

	/**
	 * Processes api conversion configs into link converters.
	 * @param apiConfigs API link conversion configurations to process
	 * @returns API converters
	 */
	private parseAPIConvertersInConfig (apiConfigs: APIsConfiguration): APILinkConverter[]
	{
		const converters: APILinkConverter[] = []
		console.debug("Loading APIs configuration…")

		if ("odesli" in apiConfigs)
		{
			console.debug("\t➥ Odesli")
			const odesliConfig: APIConfiguration = apiConfigs["odesli"]

			const converter = new OdesliMusicConverter(
				"Music",
				OdesliOrigins.map((origin): URL => new URL(origin.trim())),
				new URL("https://song.link"),
			)
			converter.setEnabled(odesliConfig.enabled || true)

			converters.push(converter)
		}


		console.info(`\t➥ ${ converters.length } api converters`)
		return converters
	}

	/**
	 * Get all origin hostnames as regular expressions
	 * @returns An array containing all the supported hostnames for detection through regular expressions
	 */
	getAllLinksOriginsAsRegExps (): RegExp[]
	{
		console.debug("Generating regular expressions for supported origins…")
		// return config_manager.Simple_Converters.filter((map: SimpleLinkConverter): boolean => map.enabled) // Filter out maps that are not enabled
		// const originsAsRegExps: RegExp[] = this.AllConverters.filter((converter: LinkConverter): boolean => converter.enabled) // Filter out maps that are disabled
		const originsAsRegExps: RegExp[] = this.AllConverters.flatMap(
			(converter: LinkConverter): RegExp[] => converter.origins.map(
				(origin): RegExp => new RegExp(`${ origin.protocol }\/\/.*${ origin.hostname.replaceAll(".", "\\.") }.*`, "i")
			)
		)
		return originsAsRegExps
	}

	/**
	 * Get all origin regular expressions
	 * @returns An array containing all the supported regular expressions for detection
	 */
	getAllLinksOriginRegExps (): RegExp[]
	{
		console.debug("Gathering all supported origin regular expressions…")
		const originRegExps: RegExp[] = this.AllConverters.flatMap((converter: LinkConverter): RegExp[] => converter.originRegExps)
		return originRegExps
	}

	/**
	 * Translates current link converters into link configurations.
	 * @returns Link configurations
	 */
	private saveSimpleConvertersInConfig (): LinkConfiguration[]
	{
		// console.debug("Parsing simple link converters into configuration…")

		const linkConfigs: LinkConfiguration[] = []
		for (const converter of this._SimpleConverters)
		{
			const config_link: LinkConfiguration = {
				name: converter.name.trim(),
				origins: converter.origins.map((origin: URL): string => origin.toString()),
				origins_regex: converter.originRegExps.map((originRegExp: RegExp): string => originRegExp.source),
				destination: converter.destination.toString().trim(),
				enabled: converter.enabled,
			}
			linkConfigs.push(config_link)
		}

		console.debug("Loaded links configuration!")
		return linkConfigs
	}

	/**
	 * Translates current API converters into API configurations.
	 * @returns API configurations
	 */
	private saveAPIConvertersInConfig (): APIsConfiguration
	{
		console.debug("Parsing api-based link converters into configuration…")
		const apiConfigs: APIsConfiguration = {}

		for (const api of this._APIConverters)
		{
			const config: APIConfiguration = {}
			if (!api.enabled) config.enabled = api.enabled
			if (api.api_key !== undefined) config.api_key = api.api_key

			apiConfigs[api.name.toLowerCase()] = config
		}

		console.debug("Loaded APIs configuration!")
		return apiConfigs
	}

	/**
	 * Generates a JSON string with the current configuration.
	 * @returns Generated JSON string of the configuration
	 */
	getConfigurationJson (): string
	{
		return stringify({ links: this.saveSimpleConvertersInConfig(), apis: this.saveAPIConvertersInConfig(), features: this.Features, about: this.About })
	}

	/**
	 * Prints the list of all the converters in the console.
	 */
	printConvertersListInConsole (): void
	{
		console.debug("Links I recognize at the moment :")
		for (const converter of this.AllConverters) console.debug(` -  ${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destination.hostname }${ converter.enabled ? "" : " (disabled)" }`)
	}

	/**
	 * Prints the list of all the features in the console.
	 */
	printFeaturesListInConsole (): void
	{
		console.debug("Features I enabled at the moment :")
		console.debug(` -  Link recognition: ${ this.Features.link_recognition }`)
		console.debug(` -  Inline queries: ${ this.Features.inline_queries }`)
		console.debug(` -  Stats: ${ this.Features.stats }`)
	}

	/**
	 * Generates a string with the list of all the converters formatted to use in a message.
	 * @returns String to use in a message
	 */
	getConvertersListForMessage (): string
	{
		let message: string = "\n<blockquote><b>🔗 Links I recognize at the moment</b>"
		for (const converter of this.AllConverters) if (converter.enabled) message += `\n${ converter.name } : ${ converter.origins.map((origin: URL): string => origin.hostname) } → ${ converter.destination.hostname }`
		message += "</blockquote>"
		return message
	}

	/**
	 * Generates a string with the list of all the features formatted to use in a message.
	 * @returns String to use in a message
	 */
	getFeaturesListForMessage (): string
	{
		let message: string = "\n<blockquote><b>🛠️ Features I enabled at the moment</b>"
		message += `\nLink recognition: ${ this.Features.link_recognition }`
		message += `\nInline queries: ${ this.Features.inline_queries }`
		message += `\nStats: ${ this.Features.stats }`
		message += "</blockquote>"
		return message
	}

	/**
	 * Load configuration from file and processes it.
	 */
	async loadConfig (): Promise<void>
	{
		console.debug(`Loading configuration from disk at ${ PATH_CONFIG_FILE }…`)
		try
		{
			const config: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE)) as Configuration

			this._SimpleConverters = this.parseSimpleConvertersInConfig(config.links)
			console.info("Loaded simple link convertions configuration!")

			this._APIConverters = this.parseAPIConvertersInConfig(config.apis)
			console.info("Loaded api-based link convertions configuration!")

			this._Features = config.features
			console.info("Loaded features configuration!")

			this._About = config.about
			console.info("Loaded about configuration!")

			this.printConvertersListInConsole()
		} catch (error)
		{
			console.error(error)
			console.error("Could not load configuration file.\nDoes it exist? Maybe a permissions issue? Maybe it wasn't mounted properly?")
			throw new Error("Can't read config")

		}
	}

	/**
	 * Translate and save configuration to file.
	 */
	async saveConfig (): Promise<void>
	{
		const config: Configuration = { links: this.saveSimpleConvertersInConfig(), apis: this.saveAPIConvertersInConfig(), features: this.Features, about: this.About }
		console.debug("Generated configuration!")
		console.debug(config)

		console.debug("Writing configuration to disk…")
		try
		{
			await Deno.writeTextFile(PATH_CONFIG_FILE, this.getConfigurationJson())
			console.info("Configuration saved!")
		} catch (error)
		{
			console.error(error)
			console.error("Could not save configuration data.\nCould there be a permissions issue?")
			throw new Error("Can't write config")

		}
	}
}
