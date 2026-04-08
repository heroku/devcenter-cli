# Dev Center CLI

Heroku CLI plugin to work with [Heroku Dev Center](https://devcenter.heroku.com) articles from your machine.

## Installation

Install as a Heroku CLI plugin:

```bash
heroku plugins:install @heroku-cli/heroku-cli-plugin-devcenter
```

For local development, from this repository:

```bash
npm install
npm run build
heroku plugins:link .
```

Requires [Node.js](https://nodejs.org/) 20+ and the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

## Usage

Commands are exposed under the `devcenter` topic, for example `heroku devcenter:open`.

### Open a published article

```bash
heroku devcenter:open error-pages
```

Use `--debug` for extra logging.

### Save a local copy of an article

From a slug:

```bash
heroku devcenter:pull article-slug
```

Or from a full article URL:

```bash
heroku devcenter:pull https://devcenter.heroku.com/articles/article-slug
```

This writes `article-slug.md` in the current directory: YAML front matter (`title`, `id`) then a blank line, then markdown body. You may edit the title and content, but **do not change the article `id`**.

Use `--force` (`-f`) to overwrite an existing file without prompting.

### Preview a local article

```bash
heroku devcenter:preview dynos
```

Starts a local server (default `127.0.0.1:3000`), opens your browser, and reloads when the `.md` file changes. Customize with `--host` and `--port`.

### Push changes to Dev Center

```bash
heroku devcenter:push dynos
```

Uses the article id in the local file to update Dev Center. Authentication uses the Heroku API token in `~/.netrc` (create it with `heroku login`). Encrypted `~/.netrc.gpg` is not supported.

### Help

```bash
heroku devcenter --help
heroku devcenter:pull --help
```

### Development / custom Dev Center URL

Point the plugin at another Dev Center base URL (e.g. a local app):

```bash
export DEVCENTER_BASE_URL=http://localhost:3000
```

### Tests

```bash
npm test
```

Automated runs set `DEVCENTER_CLI_TEST=1` so tests do not open a real browser.

## Markdown rendering

Preview and push use a markdown pipeline based on [markdown-it](https://github.com/markdown-it/markdown-it). Very complex Dev Center–specific markup may differ slightly from the legacy Ruby `devcenter-parser` gem; validate important changes on Dev Center after pushing.

## License

See [LICENSE.txt](LICENSE.txt).
