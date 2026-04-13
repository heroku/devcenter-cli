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

This will save the title and content from your local article in Dev Center, using your Heroku API credentials from netrc: plain `~/.netrc` or encrypted `~/.netrc.gpg` (decrypted with `gpg` when applicable), the same store as the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) after `heroku login`.

### Help

Get available commands

    $ devcenter help

Get help about a specific command

    $ devcenter help pull

### Heroku CLI plugin (optional)

With Node 22+ and the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli), you can link this repo and use **`heroku devcenter:open`** and **`heroku devcenter:preview`** (same behavior as `devcenter open` / `devcenter preview` above). Authentication for any Heroku API use matches the CLI: `~/.netrc` or `~/.netrc.gpg` and `heroku login`. Install from a clone:

```bash
npm install
npm run build
heroku plugins:link .
```

`pull` and `push` remain on the Ruby gem until a later release.

### Development

If you have a Dev Center instance, you can point your CLI to it by setting the `DEVCENTER_BASE_URL` env. var (e.g: `export DEVCENTER_BASE_URL=http://localhost:3000`).

TypeScript code lives under `src/` with tests under `test/`. With Node 22+, run `npm install` and `npm test`. Command tests set `DEVCENTER_CLI_TEST=1` (and `DEVCENTER_CLI_CWD` where needed) so the browser is not opened during runs.

## License

See LICENSE.txt file.

The `preview` command uses the [Font Awesome](http://fontawesome.io/) vector icons, which have their own [License](https://github.com/FortAwesome/Font-Awesome#license).
