`heroku devcenter`
==================

interact with Heroku Dev Center

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

_See code: [src/commands/devcenter/open.ts](https://github.com/heroku/devcenter-cli/blob/plugin-devcenter-v2.0.6/src/commands/devcenter/open.ts)_

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

_See code: [src/commands/devcenter/preview.ts](https://github.com/heroku/devcenter-cli/blob/plugin-devcenter-v2.0.6/src/commands/devcenter/preview.ts)_

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

_See code: [src/commands/devcenter/pull.ts](https://github.com/heroku/devcenter-cli/blob/plugin-devcenter-v2.0.6/src/commands/devcenter/pull.ts)_

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

_See code: [src/commands/devcenter/push.ts](https://github.com/heroku/devcenter-cli/blob/plugin-devcenter-v2.0.6/src/commands/devcenter/push.ts)_
