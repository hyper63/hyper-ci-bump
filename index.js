
const { readFileSync } = require('fs')
const core = require('@actions/core')
const standardVersion = require('standard-version')
const rc = require('rc')

const { run } = require('./main')

run({
  standardVersion,
  core,
  rc,
  readFileSync
}).catch(err => core.setFailed(err.message))
