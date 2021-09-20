
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const core = require('@actions/core')

const globby = require('globby')
const rc = require('rc')
const standardVersion = require('standard-version')

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

async function run (
  _sv = standardVersion,
  _rc = rc,
  _core = core
) {
  const runtime = _core.getInput('runtime') || 'deno'
  const bumpTo = _core.getInput('bump-to')
  const pkg = _core.getInput('package')
  const prefix = _core.getInput('prefix') || pkg

  /**
   * Need to find the package to bump
   */
  if (pkg) {
    const path = await getPackage(pkg, runtime)
    _core.info(`⚡️ cd into directory ${path}...`)
    process.chdir(path)
  }

  const tagPrefix = getPrefix(prefix)
  const runtimeDefaults = filterRuntimeDefaults(
    getRuntimeDefaults(runtime)
  )

  const options = _rc('version', {
    ...COMMON_DEFAULTS,
    ...runtimeDefaults,
    releaseAs: bumpTo,
    tagPrefix,
    releaseCommitMessageFormat: pkg ? `chore(${pkg}): release {{currentTag}}` : 'chore(release): {{currentTag}}'
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
  if (SUPPORTED_RUNTIMES.includes(runtime.toLowerCase())) {
    return JS_DEFAULTS
  }

  throw new Error(`Runtime ${runtime} not supported. Supported runtimes: ${SUPPORTED_RUNTIMES.join(', ')}`)
}

function getPrefix (prefix) {
  return prefix ? `${prefix}@v` : 'v'
}

function filterRuntimeDefaults (runtimeDefaults, _existsSync = existsSync) {
  return {
    ...runtimeDefaults,
    bumpFiles: runtimeDefaults.bumpFiles.filter(
      ({ filename }) => _existsSync(filename)
    )
  }
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
  filterRuntimeDefaults,
  getRuntimeDefaults,
  getPrefix,
  getPackage
}
