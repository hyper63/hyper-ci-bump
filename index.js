
import { existsSync, readFileSync } from 'node:fs'
import * as core from '@actions/core'
import { globby } from 'globby'
import rc from 'rc'
import sv from 'commit-and-tag-version'

import lib from './main.js'

const { run } = lib({ sv, rc, core, globby, existsSync, readFileSync })

run().catch(err => core.setFailed(err.message))
