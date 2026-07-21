# Contributing to the project

**Contributions are welcome! 🫶**

Feel free to fork and create a pull request (or open an issue) with your suggestion(s).
We'll be very happy to check it out. 💛

Just, please, make sure you follow these guidelines while proposing your changes:

- The proposition PR / MR has a summary explaining the changes you are suggesting to merge or the issue you found
- The request is ideally scoped to a single change or a small set of closely related changes (don't propose a PR that would rewrite a whole file and add a new unrelated feature at the same time, for example)
- The changes are is small in lines and files changed count
- Bigger changes have been discussed beforehand via an issue and explicitly authorization in writing via an issue
- Any use of LLMs or AI are disclosed (no matter minor, major or zero) including integration(s) used (MS GitHub Copilot, Claude Code, etc) and model(s) used
- Hard to understand code and complex logic have been commented to make it easy to understand and follow
- Code is not littered with unnecessary comments and console logs (debug logs must be scoped appropriately or removed before proposing the change unless it's actually useful on normal use)
- The license provided with the project must be respected and no contribution that would violate it should be submitted
- Interactions must be respectful and kind in your interactions, even during disagreements
- Patience is expected and no deadline should be imposed for responses and approvals (we're all volunteers here, and we all have our own lives and priorities)
- (Preferred) Commits are signed with a GPG or SSH key

> [!NOTE]
> ###### About AI (✨) tools usage
>
> Using AI-assisted tools such as Microsoft GitHub Copilot, ChatGPT and the likes is not prohibited and will not disqualify your contribution automatically!
> However, **proper disclosure of its usage is needed** to allow scoping the review appropriately.
> Failure to disclose its use can result in a ban if you are suspected multiple times of using such tools without disclosure.
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
    brew bundle install --file brewfile # or any other method you prefer, see https://docs.deno.com/runtime/getting_started/installation/
    ```
4.  Install dependencies
    ```shell
    deno task install
    ```
5.  Update dependencies
    ```shell
    deno task update
    ```
6.  Create a configuration file
    ```shell
    cp config.yaml.example config.yaml
    ```
7.  Set environment variables
    ```shell
    export PREVIEWSYNTH_TG_BOT_TOKEN={YOUR_BOT_TOKEN_FROM_@BOTFATHER}
    ```
8.  Run the application in development mode
    ```shell
    deno task dev
    ```
9.  Make your changes
10. Test your changes
    ```shell
    deno task test
    ```
11. Commit and push your changes to your forked repository
12. Create a pull request to merge in the main repository's `main` branch
