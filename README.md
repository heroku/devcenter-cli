# Dev Center CLI

CLI to interact with Heroku's Dev Center

## Installation

    $ gem install devcenter

## Usage

### Open a published article

    $ devcenter open error-pages

### Save a local copy of an article

You can pull an article from its slug

    $ devcenter pull article-slug

or from its URL:

    $ devcenter pull https://devcenter.heroku.com/articles/article-slug

This will save an `article-slug.md` text file in your local directory. The file includes some metadata (article title and id) followed by the article content in markdown format. You can edit both the title and the content, but **never overwrite the article id**.

### Preview a local copy of an article

    $ devcenter preview dynos

This will open a preview in your default browser and get it refreshed when you save the file. You can specify `--port` and `--host` options to customize the preview web server.

### Update an article in Dev Center from a local file

    $ devcenter push dynos

This will save the title and content from your local article in Dev Center, using your Heroku credentials from `~/.netrc`, which you can set by doing `heroku auth:login`.

### Help

Get available commands

    $ devcenter help

Get help about a specific command

    $ devcenter help pull

### Heroku CLI plugin (optional)

With Node 22+ and the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli), install the plugin and use the `devcenter` topic (same capabilities as the gem commands above):

```bash
heroku plugins:install @heroku-cli/heroku-cli-plugin-devcenter
```

For local development from this repository:

```bash
npm install
npm run build
heroku plugins:link .
```

Commands mirror the gem: **`heroku devcenter:open`**, **`pull`**, **`preview`**, and **`push`** (e.g. `heroku devcenter:pull article-slug`, `heroku devcenter:push dynos`).

**Pull:** tries public `/articles/<slug>.json`, then the same URL with `~/.netrc` Heroku credentials, then **`GET /api/v1/private/articles/<slug>.json`** so drafts can load when your account is authorized. Use **`--debug`** to log each attempt. **`--force`** (`-f`) overwrites an existing file without prompting. Encrypted `~/.netrc.gpg` is not supported.

**Push:** uses the article id in your local `.md` file and Heroku API credentials in plain **`~/.netrc`** from **`heroku login`**.

### Development

If you have a Dev Center instance, you can point the CLI at it with **`DEVCENTER_BASE_URL`** (e.g. `export DEVCENTER_BASE_URL=http://localhost:3000`).

TypeScript lives under `src/` with tests under `test/`. With Node 22+, run **`npm install`** and **`npm test`** (runs **c8** coverage gates on `src/**/*.ts`, then lint). Command tests set **`DEVCENTER_CLI_TEST=1`**, **`DEVCENTER_CLI_CWD`** where needed, and **`DEVCENTER_CLI_TEST_CONFIRM`** for pull overwrite prompts so runs stay non-interactive.

## License

See LICENSE.txt file.

The `preview` command uses the [Font Awesome](http://fontawesome.io/) vector icons, which have their own [License](https://github.com/FortAwesome/Font-Awesome#license).
