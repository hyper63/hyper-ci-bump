
import { existsSync, readFileSync } from 'node:fs'
import * as core from '@actions/core'
import * as globby from 'globby'
import * as rc from 'rc'
import * as sv from 'commit-and-tag-version'

import lib from './main.js'

const { run } = lib({ sv, rc, core, globby, existsSync, readFileSync })

run().catch(err => core.setFailed(err.message))
