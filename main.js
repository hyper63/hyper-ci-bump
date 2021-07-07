
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const core = require('@actions/core')

const globby = require('globby')
const rc = require('rc')
const standardVersion = require('standard-version')

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
const DENO_DEFAULTS = {
  bumpFiles: [
    {
      filename: DENO_MANIFEST,
      type: 'json'
    }
  ]
}

/** @type {const('standard-version').Options} */
const NODE_DEFAULTS = {
  bumpFiles: [
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

async function run (
  _sv = standardVersion,
  _rc = rc,
  _core = core
) {
  const runtime = _core.getInput('runtime') || 'deno'
  const bumpTo = _core.getInput('bump-to')
  const _package = _core.getInput('package')
  const prefix = _core.getInput('prefix') || _package

  /**
   * Need to find the package to bump
   */
  if (_package) {
    const path = await getPackage(_package, runtime)
    _core.info(`⚡️ cd into directory ${path}...`)
    process.chdir(path)
  }

  const tagPrefix = getPrefix(prefix)
  const runtimeDefaults = getRuntimeDefaults(runtime)
  const options = _rc('version', {
    ...COMMON_DEFAULTS,
    ...runtimeDefaults,
    releaseAs: bumpTo,
    tagPrefix
  })

  _core.info(`⚡️ Running with options: ${JSON.stringify(options)}...`)
  await _sv({
    ...options
  })

  let version
  runtimeDefaults.bumpFiles.forEach(({ filename }) => {
    const bumpedFileContents = readFileSync(filename, { encoding: 'utf-8' })
    const v = JSON.parse(bumpedFileContents).version
    version = v
    _core.info(
      `⚡️ version in ${filename} bumped to ${v}`
    )
  })

  _core.setOutput('version', version)
  // The tagging can be skipped, so only want to set this output, if tagging was actually performed
  if (!options.skip.tag) {
    _core.setOutput('tag', `${tagPrefix}${version}`)
  }
}

function getRuntimeDefaults (runtime) {
  return runtime === 'deno' ? DENO_DEFAULTS : NODE_DEFAULTS
}

function getPrefix (prefix) {
  return prefix ? `${prefix}@v` : 'v'
}

async function getPackage (
  pkg,
  runtime,
  _globby = globby,
  _existsSync = existsSync,
  _core = core
) {
  let paths = await _globby(`*/**/${pkg}`, {
    onlyDirectories: true
  })

  _core.info(`⚡️ matching paths: ${paths.join(', ')}`)

  /**
   * attempt to filter paths down by whether they are a module or not ie.
   * contain a manifest file at the root of the directory
   */
  if (paths.length > 1) {
    paths = paths.filter(path => _existsSync(
      join(path, runtime === 'deno' ? DENO_MANIFEST : NODE_MANIFEST)
    ))
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

module.exports = {
  run,
  getRuntimeDefaults,
  getPrefix,
  getPackage
}
