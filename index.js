
import { existsSync, readFileSync } from 'node:fs'
import * as core from '@actions/core'
import * as globby from 'globby'
import * as rc from 'rc'
import * as sv from 'commit-and-tag-version'

const { run } = require('./main')({ sv, rc, core, globby, existsSync, readFileSync })

run().catch(err => core.setFailed(err.message))
