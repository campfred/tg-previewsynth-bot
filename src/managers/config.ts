import { parse, stringify } from "@std/yaml"
import { AboutConfiguration, APIConfiguration, APIsConfiguration, Configuration, FeaturesConfiguration, LinkConfiguration, LinkConverter } from "../types/types.ts"
import { SimpleLinkConverter } from "../converters/simple.ts"
import { APILinkConverter, OdesliMusicConverter } from "../converters/music.ts"
import { OdesliOrigins } from "../types/odesli.ts"
import { UserFromGetMe } from "https://deno.land/x/grammy_types@v3.16.0/manage.ts"

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

	private constructor () { }

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
		console.debug("Reading links configuration…")
		console.debug(links)

		const converters: SimpleLinkConverter[] = links.map(function (link: LinkConfiguration): SimpleLinkConverter
		{
			console.debug(`Creating ${ SimpleLinkConverter.name } config for ${ link.name } …`)
			const simpleConverter = new SimpleLinkConverter(
				link.name.trim(),
				link.origins.map((origin: string) => new URL(origin.trim())),
				new URL(link.destination.trim()),
				link.settings,
			)
			link.enabled ? simpleConverter.enable() : simpleConverter.disable()
			return simpleConverter
		})

		console.info(`Parsed links configuration!`)
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
		console.debug("Reading APIs configuration…")

		if ("odesli" in apiConfigs)
		{
			console.debug("Found Odesli API configuration!")
			const odesliConfig: APIConfiguration = apiConfigs["odesli"]

			const musicConverter = new OdesliMusicConverter(
				"Music",
				OdesliOrigins.map((origin): URL => new URL(origin)),
				new URL("https://song.link"),
			)
			odesliConfig.enabled ? musicConverter.enable() : musicConverter.disable()

			converters.push(musicConverter)
		}

		console.info("Parsed APIs configuration!")
		return converters
	}

	/**
	 * Translates current link converters into link configurations.
	 * @returns Link configurations
	 */
	private saveSimpleConvertersInConfig (): LinkConfiguration[]
	{
		console.debug("Parsing simple link converters into configuration…")

		const linkConfigs: LinkConfiguration[] = []
		for (const link_map of this._SimpleConverters)
		{
			const config_link: LinkConfiguration = {
				name: link_map.name.trim(),
				origins: link_map.origins.map((origin: URL): string => origin.toString().trim()),
				destination: link_map.destination.toString().trim(),
				enabled: link_map.enabled,
			}
			linkConfigs.push(config_link)
		}

		console.debug("Web link maps parsed into configuration!")
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

		console.debug("API link converters translated into configuration!")
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
	 * Load configuration from file and processes it.
	 */
	async loadConfig (): Promise<void>
	{
		console.debug(`Loading configuration from disk at ${ PATH_CONFIG_FILE } …`)
		try
		{
			const config: Configuration = parse(await Deno.readTextFile(PATH_CONFIG_FILE)) as Configuration

			this._SimpleConverters = this.parseSimpleConvertersInConfig(config.links)
			console.info("Loaded simple link convertions configuration!")
			// console.table(config.links);
			// console.table(this._links);

			this._APIConverters = this.parseAPIConvertersInConfig(config.apis)
			console.info("Loaded api-based link convertions configuration!")
			// console.table(config.apis);
			// console.table(this._apis);

			this._Features = config.features
			console.info("Loaded features configuration!")
			// console.table(this._features);

			this._About = config.about
			console.info("Loaded about configuration!")
			// console.table(this._about);
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
