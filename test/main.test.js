import { test, describe, expect } from 'vitest'

const lib = require('../main')

const core = {
  info: () => { }
}

describe('main', () => {
  describe('getBumpTo', () => {
    test('it produces the correct version', t => {
      const { getBumpTo } = lib()

      expect(getBumpTo('v2.3.0')).toBe('v2.3.0')
      expect(getBumpTo('semver')).toBeUndefined()
      expect(getBumpTo('semver ')).toBeUndefined()
      expect(getBumpTo()).toBeUndefined()
    })
  })

  describe('getRuntimeDefaults', () => {
    test('it produces correct runtime defaults', t => {
      const { getRuntimeDefaults } = lib()
      let res = getRuntimeDefaults('node')

      expect(res.bumpFiles.length).toBe(3)

      res = getRuntimeDefaults('deno')

      expect(res.bumpFiles.length).toBe(3)
      expect(() => getRuntimeDefaults('foo_runtime')).toThrow()
    })
  })

  describe('getPrefix', () => {
    test('it produces the correct prefix', t => {
      const { getPrefix } = lib()
      expect(getPrefix()).toBe('v')
      expect(getPrefix('foo')).toBe('foo@v')
    })
  })

  describe('getPackage', () => {
    test('it should produce the correct package', async t => {
      const mockedPath = 'packages/foo'
      const { getPackage } = lib({
        globby: () => Promise.resolve([mockedPath]),
        existsSync: () => true,
        core
      })

      const res = await getPackage(mockedPath)

      expect(mockedPath).toBe(res)
    })

    test('it should produce the correct package from multiple', async t => {
      const mockedPath = 'packages/foo'
      const queue = [true, false]

      const { getPackage } = lib({
        globby: () => Promise.resolve([mockedPath, '/packages/lib/foo']),
        existsSync: () => {
          return queue.shift()
        },
        core
      })

      const res = await getPackage('foo')

      expect(mockedPath).toBe(res)
    })

    test('it should throw an error if more than one package is found', async t => {
      const mockedPath = 'packages/foo'

      const { getPackage } = lib({
        globby: () => Promise.resolve([mockedPath, '/packages/lib/foo']),
        existsSync: () => true,
        core
      })

      await getPackage('foo')
        .then(() => expect(false).toBe(true))
        .catch(err => expect(err).toBeDefined())
    })

    test('it should throw an error if no package is found', async t => {
      const { getPackage } = lib({
        globby: () => Promise.resolve([]),
        existsSync: () => true,
        core
      })

      await getPackage('foo')
        .then(() => expect.fail())
        .catch(err => expect(err).toBeDefined())
    })
  })

  describe('filterRuntimeDefaults', () => {
    test('it should filter the bumpFiles', async t => {
      const queue = [true, false]

      const { filterRuntimeDefaults } = lib({
        globby: () => Promise.resolve([]),
        existsSync: () => {
          return queue.shift()
        },
        core
      })

      const res = filterRuntimeDefaults(
        {
          bumpFiles: [
            {
              filename: 'foo'
            },
            {
              filename: 'bar'
            }
          ]
        }
      )

      expect(res.bumpFiles.length).toBe(1)
    })
  })
})
