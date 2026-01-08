import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import type { Config } from '@japa/runner/types'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
]

/**
 * Configure lifecycle hooks to run before and after all tests
 */

export const runnerHooks: Pick<Config, 'setup' | 'teardown'> = {
  setup: [
    () => testUtils.db().migrate(),
    () => testUtils.db().seed(),
    () => testUtils.httpServer().start(),
  ],
  teardown: [],
}

/**

 * Configure the test reporters

 */

export const reporters: Config['reporters'] = {
  activated: ['spec'],
}

/**

 * Configure the test timeout

 */

export const timeout: Config['timeout'] = 30_000

export const configureSuite: Config['configureSuite'] = (suite) => {
  suite.onGroup((group) => {
    group.each.setup(() => testUtils.db().withGlobalTransaction())
  })
}
