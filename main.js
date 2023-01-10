
const { join } = require('path')

const SUPPORTED_RUNTIMES = ['node', 'deno', 'javascript']
const DENO_MANIFEST = 'egg.json'
const NODE_MANIFEST = 'package.json'

/** @type {const('standard-version').Options} */
const COMMON_DEFAULTS = {
  noVerify: true,
  // No package files means version always pulled from git tag
  packageFiles: [],
  // overwritten via runtime deno or node defaults
  bumpFiles: [],
  skip: {
    bump: false,
    changelog: true, // skip changelog generation
    commit: false,
    tag: false
  }
}

/** @type {const('standard-version').Options} */
const JS_DEFAULTS = {
  bumpFiles: [
    {
      filename: DENO_MANIFEST,
      type: 'json'
    },
    {
      filename: NODE_MANIFEST,
      type: 'json'
    },
    {
      filename: 'package-lock.json',
      type: 'json'
    }
  ]
}

function lib ({
  sv = require('standard-version'),
  rc = require('rc'),
  core = require('@actions/core'),
  globby = require('globby'),
  existsSync = require('fs').existsSync,
  readFileSync = require('fs').readFileSync
} = {}) {
  async function run () {
    const runtime = core.getInput('runtime') || 'javascript'
    const pkg = core.getInput('package')
    const prefix = core.getInput('prefix') || pkg
    let bumpTo = core.getInput('bump-to')

    bumpTo = getBumpTo(bumpTo)

    let commitsOnPath
    /**
     * Need to find the package to bump
     */
    if (pkg) {
      const path = await getPackage(pkg, runtime)
      core.info(`⚡️ cd into directory ${path}...`)
      process.chdir(path)
      // We've already cd'd into the directory, so just use . (cur directory)
      // This is ultimately passed to `git log` which runs in cwd
      commitsOnPath = '.'
    }

    const tagPrefix = getPrefix(prefix)
    const runtimeDefaults = filterRuntimeDefaults(
      getRuntimeDefaults(runtime)
    )

    const options = rc('version', {
      ...COMMON_DEFAULTS,
      ...runtimeDefaults,
      releaseAs: bumpTo,
      path: commitsOnPath,
      tagPrefix,
      releaseCommitMessageFormat: pkg ? `chore(${pkg}): release {{currentTag}}` : 'chore(release): {{currentTag}}'
    })

    core.info(`⚡️ Running with options: ${JSON.stringify(options)}...`)
    await sv({
      ...options
    })

    let version
    runtimeDefaults.bumpFiles.forEach(({ filename }) => {
      const bumpedFileContents = readFileSync(filename, { encoding: 'utf-8' })
      const v = JSON.parse(bumpedFileContents).version
      version = v
      core.info(
        `⚡️ version in ${filename} bumped to ${v}`
      )
    })

    core.setOutput('version', version)
    // The tagging can be skipped, so only want to set this output, if tagging was actually performed
    if (!options.skip.tag) {
      core.setOutput('tag', `${tagPrefix}${version}`)
    }
  }

  function getBumpTo (bumpTo) {
    if (!bumpTo || bumpTo.trim() === 'semver') {
      bumpTo = undefined // let standard-version determine the version
    }

    return bumpTo
  }

  function getRuntimeDefaults (runtime) {
    if (SUPPORTED_RUNTIMES.includes(runtime.toLowerCase())) {
      return JS_DEFAULTS
    }

    throw new Error(`Runtime ${runtime} not supported. Supported runtimes: ${SUPPORTED_RUNTIMES.join(', ')}`)
  }

  function getPrefix (prefix) {
    return prefix ? `${prefix}@v` : 'v'
  }

  function filterRuntimeDefaults (runtimeDefaults) {
    return {
      ...runtimeDefaults,
      bumpFiles: runtimeDefaults.bumpFiles.filter(
        ({ filename }) => existsSync(filename)
      )
    }
  }

  async function getPackage (
    pkg
  ) {
    let paths = await globby(`*/**/${pkg}`, {
      onlyDirectories: true
    })

    core.info(`⚡️ matching paths: ${paths.join(', ')}`)

    /**
   * attempt to filter paths down by whether they are a module or not ie.
   * contain a manifest file at the root of the directory
   */
    if (paths.length > 1) {
      paths = paths.filter(path =>
        existsSync(
          join(path, DENO_MANIFEST)
        ) ||
        existsSync(
          join(path, NODE_MANIFEST)
        )
      )
    }

    /**
   * Too many matching packages in the repo, so will fail fast, instead of guessing.
   */
    if (paths.length > 1) {
      throw new Error(`Multiple paths matched. Cannot determine which package to bump ${paths.join(', ')}`)
    }

    if (paths.length === 0) {
      throw new Error('No packages found. Cannot determine which package to bump')
    }

    const path = paths.shift()

    return path
  }

  return {
    run,
    filterRuntimeDefaults,
    getBumpTo,
    getRuntimeDefaults,
    getPrefix,
    getPackage
  }
}

module.exports = lib
