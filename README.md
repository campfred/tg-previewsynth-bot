# Preview Synth Bot

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
  > reddit.com ➡️ vxreddit.com
- Bluesky
  > bsky.app ➡️ fxbsky.app
- Twitter
  > twitter.com, x.com ➡️ fxtwitter.com
- Instagram
  > instagram.com ➡️ ddinstagram.com
- TikTok
  > tiktok.com ➡️ tfxktok.com
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

## Deployment

### Prerequisites

- An Internet connection
- A Telegram Bot token (talk to [@BotFather](https://BotFather.t.me) to get one)
- Deno@v2

### Steps

1. Create [config.yaml](config.yaml) configuration file (use [config.yaml.example](config.yaml.example) as a complete example)
2. Set environment variables
   > `export PREVIEWSYNTH_TG_BOT_TOKEN={YOUR_BOT_TOKEN_FROM_@BOTFATHER}` or use `.env` file (use [.env.example](.env.example) as a complete example)
3. Run application
   1. Container
      1. Pull image
         > `docker pull ghcr.io/campfred/tg-previewsynth-bot:main`
      2. Run image
         > With env variable : `docker run --detach --read-only --volume $PWD/config.yaml:/app/config.yaml --env PREVIEWSYNTH_TG_BOT_TOKEN=$PREVIEWSYNTH_TG_BOT_TOKEN ghcr.io/campfred/tg-previewsynth-bot:main`
         > With .env file : `docker run --detach --read-only --volume $PWD/config.yaml:/app/config.yaml --env-file $PWD/.env ghcr.io/campfred/tg-previewsynth-bot:main`
         > > [!note]
         > > The suggested command mounts the configuration file as a read-only resource with option `--read-only`.
         > > If you plan on using the `/save` command, you may want to leave that option (`--read-only`) out.
   2. Local
      1. Install dependancies
         > `deno task install`
      2. Run app
         > `deno task start`
4. Use it!

### Available environment variables

| name                            | default         | description                                                   |
| ------------------------------- | --------------- | ------------------------------------------------------------- |
| `PREVIEWSYNTH_TG_BOT_TOKEN`     | `null`          | Telegram bot token from [@BotFather](https://BotFather.t.me). |
| `PREVIEWSYNTH_CONFIG_FILE_PATH` | `./config.yaml` | Path to the configuration file.                               |

## Upcoming improvements

- API-based link converters
  - Odesli / SongLinks
    - Optional _Special function_ button
      - To expand the message with basic infos
  - Allow adding unsupported APIs to config
    > Probably through _config.yaml_.(apis.base_url+api_key+response_path)
- Releases
  - Add job to compile binary of the bot [with Deno compile](https://youtu.be/ZsDqTQs3_G0)
