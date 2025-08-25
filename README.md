# Preview Synth Bot

[![Dependabot Updates](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/dependabot/dependabot-updates) [![CodeQL](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/github-code-scanning/codeql) [![Test conversion use-cases](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/test.yml/badge.svg)](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/test.yml) [![Application build](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/build.yml/badge.svg)](https://github.com/campfred/tg-previewsynth-bot/actions/workflows/build.yml) [![GitHub Release](https://img.shields.io/github/v/release/campfred/tg-previewsynth-bot?display_name=tag&label=Latest%20release%20tag)](https://github.com/campfred/tg-previewsynth-bot/releases/latest) 

Telegram bot to automatically convert links into embed-friendly ones for Telegram and other messaging platforms. ✨

## General use cases

- Private chat with bot, by sending links directly or using the `/convert` command.
- Anywhere on Telegram, by using in-line queries. Begin with the bot's handle (i.e. `@PreviewSynthBot`) followed by a link to convert, then select the command in the list that appears.
- In any type of chats (private, groups, supergroups and channels) by sending links and the bot replying to said link with a converted one.

## Supported links

- FurAffinity
  > furaffinity.net ➡️ xfuraffinity.net
- Furtrack
  > furtrack.com ➡️ furtrack.owo.lgbt
- Reddit
  > reddit.com ➡️ vxreddit.com, rxddit.com
- Bluesky
  > bsky.app ➡️ fxbsky.app
- Twitter
  > twitter.com, x.com ➡️ fxtwitter.com, vxtwitter.com, fixupx.com, girlcockx.com, xcancel.com
- Instagram
  > instagram.com ➡️ ddinstagram.com, instagramez.com
- TikTok
  > tiktok.com ➡️ vxtiktok, tfxktok.com
- Music (through [Odesli's API](https://odesli.co))
  > open.spotify.com, music.apple.com, music.youtube.com, tidal.com, pandora.com, deezer.com, soundcloud.com, music.amazon.com ➡️ song.link

## Supported commands

### Public commands

- `/start`
  > Welcomes user to using the bot and gives small usage example.
- `/help`
  > Details usage and lists supported sites.
- `/convert`
  > Converts a link (if supported) into an embed-friendly one for social messaging use.

### Admin commands

- `/enable {name|origin|destination}`
  > Enables converting a given web link mapping.
- `/disable {name|origin|destination}`
  > Disables converting a given web link mapping.
- `/toggle {name|origin|destination}`
  > Toggles converting a given web link mapping.
- `/stats` (if stats enabled, default `true`)
  > Shows the bot's statistics.
- `/clear`
  > Clears the bot's cache.
- `/save`
  > Saves configuration to disk.
- `/reload`
  > Reloads configuration from disk.

## Configuration

The bot's behaviour is set via a configuration file in YAML format.

> [!tip]
> There is an example configuration file [in this respoitory](config.yaml.example) that you can fill in with your own details.
> It also contains the conversion links I personnaly use on my own deployment.

```yaml
# config.yaml
about:
  code_repo: https://github.com/campfred/tg-previewsynth-bot # Your code repository's URL, used by the bot for directing users to issues and stuff.
  owner: 12345678 # Your own Telegram user ID, used by the bot to recognize you for admin commands.
  status_updates: # Optional
    chat: -12345678901234 # Chat ID where you'd like to send bot status updates.
    topic: 1234 # Optional, topic you'd like to use for those updates.
links:
  - name: Example # Display name of the website, ie.: FurAffinity
    origins: # Base URLs that must be converted, can be a single one as long as it stays an array
      - https://origin.com
      - https://origin.app
    destinations: # Base URL(s) to convert to, can be a single one as long as it stays an array
      - https://example.com # First is used as default for /convert and conversational conversions
      - https://example2.com # Proposed only through in-line queries
    enabled: true # Optional, set to false to keep it disabled
    settings: # Optional, allows configuring some quirks about that site's links
      expand: true # Optional, set to false to disable expanding links
      preserveQueryParamKeys: # Optional, set query parameter keys to keep during link cleanup
        - id
        - flavour
apis:
  odesli:
    enabled: true # Enable Odesli API-based converter
    # api_key: *** # Not using an API key grants you only 10 reqs. per minute
features: # Disable behaviour features here
  link_recognition: true # Optional, disabled by default
  inline_queries: true # Optional, disabled by default
  stats: true # Optional, disabled by default
```

## Deployment

### Prerequisites

- An Internet connection
- A Telegram Bot token (talk to [@BotFather](https://BotFather.t.me) to get one)
- Deno@v2
- [A configuration file]

### Steps

1. Create [a configuration file](#configuration) (use [config.yaml.example](config.yaml.example) as a complete example)
2. Set environment variables
   > `export PREVIEWSYNTH_TG_BOT_TOKEN={YOUR_BOT_TOKEN_FROM_@BOTFATHER}` or use `.env` file (use [.env.example](.env.example) as a complete example)
3. Run application
   1. Container
      1. Pull image

         > ```shell
         > docker pull ghcr.io/campfred/tg-previewsynth-bot:main
         > ```

      2. Run image
         > With env variable :
         >
         > ```shell
         > docker run --detach --read-only --volume $PWD/config.yaml:/app/config.yaml --env PREVIEWSYNTH_TG_BOT_TOKEN=$PREVIEWSYNTH_TG_BOT_TOKEN ghcr.io/campfred/tg-previewsynth-bot:main
         > ```
         >
         > With .env file :
         >
         > ```shell
         > docker run --detach --read-only --volume $PWD/config.yaml:/app/config.yaml --env-file $PWD/.env ghcr.io/campfred/tg-previewsynth-bot:main
         > ```
         >
         > > [!note]
         > > The suggested command mounts the configuration file as a read-only resource with option `--read-only`.
         > > If you plan on using the `/save` command, you may want to leave the `--read-only` option out.
   2. Binaries
      1. Download [the latest binary executable release](https://github.com/campfred/tg-previewsynth-bot/releases/latest) corresponding to your platform
      2. Run the binary executable release by double clicking or through CLI
   3. Code base
      1. Pull this repository and open a terminal in it
      2. Move your configuration file at your position

         > ```shell
         > mv /path/config.yaml .
         > ```

      3. Install dependancies

         > ```shell
         > deno task cache
         > ```

      4. Run app

         > ```shell
         > deno task start
         > ```

4. Use it!

### Available environment variables

| name                            | default         | description                                                   |
| ------------------------------- | --------------- | ------------------------------------------------------------- |
| `PREVIEWSYNTH_TG_BOT_TOKEN`     | _(none)_        | Telegram bot token from [@BotFather](https://BotFather.t.me). |
| `PREVIEWSYNTH_CONFIG_FILE_PATH` | `./config.yaml` | Path to the configuration file.                               |
| `PREVIEWSYNTH_LOG_LEVEL`        | _(none)_        | Logging level to use for software logging.                    |

## Upcoming improvements

- API-based link converters
  - Odesli / SongLinks
    - Optional _Special function_ button
      - To expand the message with basic infos
  - Allow adding unsupported APIs to config
    > Probably through _config.yaml_.(apis.base_url+api_key+response_path)
