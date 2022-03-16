<h1 align="center">hyper-ci-bump</h1>
<p align="center">A Github action to bump manifest files based on the provided semver compatible version</p>
</p>

---

## Table of Contents

- [Getting Started](#getting-started)
- [API](#api)
- [License](#license)

## Getting Started

This action can be used as part of any Github workflow.

- Bump manifest files (according to latest semver compatible Git tag)
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
        description: the semver version to bump to ('semver' to semver bump based on commits)
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
        # 0 means pull down all history, so all tags can be grep'd
          fetch-depth: 0
      - uses: actions/setup-node@v2
        with:
          node-version: 16.x
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
          prefix: ${{github.event.inputs.prefix}}
          runtime: ${{github.event.inputs.runtime}}
      # Push the new commits and tags back to the repo
      - name: push
        run: |
          git push --follow-tags
```

> This module itself is versioned using `hyper-ci-bump`. Check out [the tag and release workflow](./.github/workflows/tag-and-release.yml)

## API

### Inputs

- *string* `bump-to` **Optional**: the semver comptaible version to bump to. If the string "semver" or nothing is passed, then it will semver bump the package based on commit messages, following conventional-commit standards.
- *string* `package` **Optional**: the package name that contains the files to bump. Great for repos with multiple independently versioned packages ie. in a monorepo. Example: `app-opine` will find a package in `*/**/app-opine`
- *string* `prefix` **Optional**: prefix to use for the git tag. Example: `app-opine` prefix and `v1.3.2` version will result in a tag of `app-opine@v1.3.2`. **default**: the `package` input.
- *string* `runtime` **Optional**: This dictates which manifest files are bumped.  Currently supports `node`, `deno`, or `javascript`. The following table shows which manifest files will be bumped for each runtime. **default**: `javascript`

| runtime | manifest files bumped |
| ------------- | ------------- |
| `deno`, `node`, `javascript` | `egg.json`, `package.json`, `package-lock.json`  |

TODO: add some more run times

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

By default, `bump`, `commit`, and `tag` are enabled.

## License

Apache-2.0

## Contributing

Logic can be found in `main.js` and dependencies are provided via `index.js`. This is a github action, so `node_modules` are intentionally committed to the repo.
