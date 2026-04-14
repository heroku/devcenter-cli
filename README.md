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

Commands mirror the gem: **`heroku devcenter:open`**, **`pull`**, **`preview`**, and **`push`** (e.g. `heroku devcenter:pull article-slug`, `heroku devcenter:push dynos`).

**Pull:** tries public `/articles/<slug>.json`, then the same URL with `~/.netrc` Heroku credentials, then **`GET /api/v1/private/articles/<slug>.json`** so drafts can load when your account is authorized. Use **`--debug`** to log each attempt. **`--force`** (`-f`) overwrites an existing file without prompting. Encrypted `~/.netrc.gpg` is not supported.

**Push:** uses the article id in your local `.md` file and Heroku API credentials in plain **`~/.netrc`** from **`heroku login`**.

## `heroku devcenter`

<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/heroku-cli-plugin-devcenter
$ heroku COMMAND
running command...
$ heroku (--version)
@heroku-cli/heroku-cli-plugin-devcenter/1.3.1 darwin-arm64 node-v24.14.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->

<!-- commands -->
* [`heroku devcenter:open SLUG`](#heroku-devcenteropen-slug)
* [`heroku devcenter:preview SLUG`](#heroku-devcenterpreview-slug)
* [`heroku devcenter:pull SLUGORURL`](#heroku-devcenterpull-slugorurl)
* [`heroku devcenter:push SLUG`](#heroku-devcenterpush-slug)

## `heroku devcenter:open SLUG`

open a published Dev Center article in your browser

```
USAGE
  $ heroku devcenter:open SLUG [--prompt]

ARGUMENTS
  SLUG  article slug (e.g. ps for https://devcenter.heroku.com/articles/ps)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  open a published Dev Center article in your browser
```

_See code: [src/commands/devcenter/open.ts](https://github.com/heroku/devcenter-cli/blob/v1.3.1/src/commands/devcenter/open.ts)_

## `heroku devcenter:preview SLUG`

preview a local Dev Center article in the browser with live reload

```
USAGE
  $ heroku devcenter:preview SLUG [--prompt] [--host <value>] [--port <value>]

ARGUMENTS
  SLUG  article slug (local <slug>.md file)

FLAGS
  --host=<value>  [default: 127.0.0.1] bind host for the preview server
  --port=<value>  [default: 3000] port for the preview server

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  preview a local Dev Center article in the browser with live reload
```

_See code: [src/commands/devcenter/preview.ts](https://github.com/heroku/devcenter-cli/blob/v1.3.1/src/commands/devcenter/preview.ts)_

## `heroku devcenter:pull SLUGORURL`

save a local copy of a Dev Center article

```
USAGE
  $ heroku devcenter:pull SLUGORURL [--prompt] [--debug] [-f]

ARGUMENTS
  SLUGORURL  article slug or full Dev Center article URL

FLAGS
  -f, --force  overwrite an existing local file without prompting
      --debug  log HTTP status and response shape for public, authenticated public, and private API article fetch

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  save a local copy of a Dev Center article
```

_See code: [src/commands/devcenter/pull.ts](https://github.com/heroku/devcenter-cli/blob/v1.3.1/src/commands/devcenter/pull.ts)_

## `heroku devcenter:push SLUG`

update a Dev Center article from a local markdown file

```
USAGE
  $ heroku devcenter:push SLUG [--prompt]

ARGUMENTS
  SLUG  article slug (optional .md suffix is ignored)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  update a Dev Center article from a local markdown file
```

_See code: [src/commands/devcenter/push.ts](https://github.com/heroku/devcenter-cli/blob/v1.3.1/src/commands/devcenter/push.ts)_
<!-- commandsstop -->

### Development

If you have a Dev Center instance, you can point the CLI at it with **`DEVCENTER_BASE_URL`** (e.g. `export DEVCENTER_BASE_URL=http://localhost:3000`).

TypeScript code lives under `src/` with tests under `test/`. With Node 22+, run `npm install` and `npm test`. Tests stub `child_process.spawn` (via sinon) so browser opens are mocked. `DEVCENTER_CLI_CWD` can override the article working directory in tests.

Verbose logging uses the [`debug`](https://www.npmjs.com/package/debug) package, for example `DEBUG=devcenter:open`, `DEBUG=devcenter:preview`, or `DEBUG=devcenter:*`.

## License

See LICENSE.txt file.

The `preview` command uses the [Font Awesome](http://fontawesome.io/) vector icons, which have their own [License](https://github.com/FortAwesome/Font-Awesome#license).
