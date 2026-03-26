# Contributing to the project

**Contributions are welcome!**
I'm actually happy that you are reading this file.
For real, I enjoy sharing my stuff and I love learning from others.
This is why this repository exists publicly in the first place. 😋

So, yeah! Feel free to fork and create a pull request or even file an issue with your suggestion(s). 💛

Just, please, make sure you follow these guidelines while proposing your changes:

- Your proposition PR / MR has a summary explaining the changes you are suggesting to merge or the issue you found
- Your proposition is ideally scoped to a single change or a small set of closely related changes (don't propose a PR that would rewrite a whole file and add a new unrelated feature at the same time, for example)
- Your proposition is small in lines and files changed count
- Bigger propositions must be discussed beforehand via an issue and only upon explicit authorization you may proceed to propose a bigger change
- You disclose any use of LLMs or AI agents in your contribution (no matter minor or major) including integration(s) used and model(s) used
- You comment hard to understand code and complex logic to make it easy to understand and follow
- You do not litter the code with unnecessary comments and console logs (if you need to add a console log for debugging purposes, make sure to scope it appropriately or remove it before proposing your change unless it's actually useful on normal use)
- You respect the license provided with the project and do not submit any contribution that would violate it
- You stay respectful and kind in your interactions, even during disagreements
- You are patient and do not impose any deadline for responses and approvals

> [!NOTE]
> ###### About AI (✨) tools usage
>
> Using AI-assisted tools such as GitHub Copilot, ChatGPT and the likes it is not prohibited and will not disqualify your contribution automatically.
> However, **proper disclosure of its usage is needed** to allow scoping the review appropriately.
> Failure to disclose its use can result in a ban.
>
> Also, since this project is primarly meant for usage by humans, there is an implicit expectation that the project's focus remains toward humans.
> Therefore, no contribution solely meant to aid AI-assisted tools usage (so, without bringing any added value for direct usage or consumption by humans) will be accepted.

## Development setup guide

1.  Fork the repository
2.  Clone the forked repository
    ```shell
    git clone https://github.com/campfred/tg-previewsynth-bot.git
    cd tg-previewsynth-bot
    ```
3.  Install Deno
    ```shell
    brew install deno # or any other method you prefer, see https://docs.deno.com/runtime/getting_started/installation/
    ```
4.  Install dependencies
    ```shell
    deno task install
    ```
5.  Create a configuration file
    ```shell
    cp config.yaml.example config.yaml
    ```
6.  Set environment variables
    ```shell
    export PREVIEWSYNTH_TG_BOT_TOKEN={YOUR_BOT_TOKEN_FROM_@BOTFATHER}
    ```
7.  Run the application in development mode
    ```shell
    deno task dev
    ```
8.  Make your changes
9.  Test your changes
    ```shell
    deno task test
    ```
10. Commit and push your changes to your forked repository
11. Create a pull request to merge in the main repository's `main` branch
