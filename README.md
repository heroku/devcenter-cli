# @heroku-cli/plugin-devcenter

Heroku CLI plugin to interact with Heroku Dev Center

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-devcenter.svg)](https://npmjs.org/package/@heroku-cli/plugin-devcenter)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-devcenter.svg)](https://github.com/heroku/devcenter-cli/blob/main/LICENSE.txt)

## Installation

```bash
heroku plugins:install @heroku-cli/plugin-devcenter
```

<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-devcenter
$ heroku COMMAND
running command...
$ heroku (--version)
@heroku-cli/plugin-devcenter/1.3.1 darwin-arm64 node-v24.14.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
* [`heroku devcenter:open SLUG`](#heroku-devcenteropen-slug)
* [`heroku devcenter:preview SLUG`](#heroku-devcenterpreview-slug)
* [`heroku devcenter:pull SLUGORURL`](#heroku-devcenterpull-slugorurl)
* [`heroku devcenter:push SLUG`](#heroku-devcenterpush-slug)

## `heroku devcenter:open SLUG`

open a Dev Center article in the browser (uses Heroku credentials for private or draft content when available)

```
USAGE
  $ heroku devcenter:open SLUG [--prompt]

ARGUMENTS
  SLUG  article slug (e.g. ps for https://devcenter.heroku.com/articles/ps)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  open a Dev Center article in the browser (uses Heroku credentials for private or draft content when available)
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
  $ heroku devcenter:pull SLUGORURL [--prompt] [-f]

ARGUMENTS
  SLUGORURL  article slug or full Dev Center article URL

FLAGS
  -f, --force  overwrite an existing local file without prompting

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

## Development

TypeScript code lives under `src/` with tests under `test/`. With Node 22+, run `npm install` and `npm test`.

If you have a Dev Center instance, you can point your CLI to it by setting the `DEVCENTER_BASE_URL` environment variable:

```bash
export DEVCENTER_BASE_URL=http://localhost:3000
```

Verbose logging uses the [`debug`](https://www.npmjs.com/package/debug) package:

```bash
DEBUG=devcenter:open heroku devcenter:open my-article
DEBUG=devcenter:preview heroku devcenter:preview my-article
DEBUG=devcenter:* heroku devcenter:open my-article
```

## License

See [LICENSE.txt](LICENSE.txt) file.

The `preview` command uses the [Font Awesome](http://fontawesome.io/) vector icons, which have their own [License](https://github.com/FortAwesome/Font-Awesome#license).
