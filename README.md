<h1 align="center">hyper-ci-bump</h1>
<p align="center">A Github action to bump manifest files based on the provided semver compatible version</p>
</p>

---

## Table of Contents

- [Getting Started](#getting-started)
- [API](#API)
- [License](#license)

## Getting Started

This action can be used as part of any Github workflow.

- Bump manifest files
- Generate changelog (disabled by default)
- commit changes
- tag new commit

This can then be pushed back to the repo using `git push --follow-tags`

```yml
name: Tag and Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: the server version to bump to
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14.x
      # Make sure your git user is set
      - name: set git user
        run: |
          git config --global user.name "${{ github.actor }}"
          git config --global user.email "${{ github.actor }}@users.noreply.github.com"
      # Pull in the action
      - name: bump
        id: bump
        uses: hyper63/hyper-ci-bump@main
        with:
          bump-to: ${{github.event.inputs.version}}
          package: ${{github.event.inputs.package}}
          runtime: ${{github.event.inputs.runtime}}
      # Push the new commits and tags back to the repo
      - name: push
        run: |
          git push --follow-tags
```

## API

### Inputs

- *string* `bump-to` **Required**: the semver comptaible version to bump to
- *string* `package` **Optional**: the package name to use as a tag prefix. Great for repos with multiple independently versioned packages ie. in a monorepo
- *string* `runtime` **Optional**: the runtime for the package. `node` or `deno` **default**: `deno`. This dictates which manifest files are bumped. `egg.json` for `deno`, and `package.json` and `package-lock.json` for `node`

### Outputs

- *string* `version`: The semver version bumped to
- *string* `tag`: The git tag created, if tagging was performed. Otherwise `undefined`

### Configuration

a `.versionrc` can be used to override behavior. For example, to enable generation of a changelog, create `.versionrc` file at the root of the project like this:

```json
{
  "skip": {
    "changelog": false
  }
}
```

Now a changelog will be generated and/or appended to for the repo. Any of the following lifecycle can be enabled/disabled using this method:

`bump`, `changelog`, `commit`, `tag`

## License

Apache-2.0

## Contributing

Logic can be found in `main.js` and dependencies are provided via `index.js`. There is a `pre-commit` git hook that will rebuild any `*.js` changes into `dist`, so ensure git hooks are installed by running `npm i` or `npm prepare`. 
