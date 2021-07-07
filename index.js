
const core = require('@actions/core')

const { run } = require('./main')

run().catch(err => core.setFailed(err.message))
