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
@heroku-cli/plugin-devcenter/2.0.5 linux-x64 node-v22.23.2
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
# Command Topics

* [`heroku devcenter`](docs/devcenter.md) - interact with Heroku Dev Center

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
