

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
      filename: 'egg.json',
      type: 'json'
    }
  ]
}

/** @type {const('standard-version').Options} */
const NODE_DEFAULTS = {
  bumpFiles: [
    {
      filename: 'package.json',
      type: 'json'
    },
    {
      filename: 'package-lock.json',
      type: 'json'
    }
  ]
}

async function run ({
  standardVersion,
  core,
  rc,
  readFileSync
}) {
  const runtime = core.getInput('runtime') || 'deno'
  const bumpTo = core.getInput('bump-to')

  const runtimeDefaults = runtime === 'node' ? NODE_DEFAULTS : DENO_DEFAULTS
  const options = rc('version', {
    ...COMMON_DEFAULTS,
    ...runtimeDefaults,
    releaseAs: bumpTo
  })

  core.info(`⚡️ Running with options: ${JSON.stringify(options)}...`)
  await standardVersion(options)
  
  runtimeDefaults.bumpFiles.forEach(({ filename }) => {
    const bumpedFileContents = readFileSync(filename, { encoding: 'utf-8' })
    core.info(
      `⚡️ version in ${filename} bumped to ${JSON.parse(bumpedFileContents).version}`
    )
  })

  core.setOutput('version', bumpTo)
}

module.exports = {
  run
}