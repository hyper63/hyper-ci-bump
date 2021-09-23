
const test = require('tape')

const lib = require('../main')

const core = {
  info: () => {}
}

test('it produces correct runtime defaults', t => {
  const { getRuntimeDefaults } = lib()
  let res = getRuntimeDefaults('node')

  t.equals(res.bumpFiles.length, 3)

  res = getRuntimeDefaults('deno')

  t.equals(res.bumpFiles.length, 3)

  t.throws(
    () => getRuntimeDefaults('foo_runtime')
  )

  t.end()
})

test('it produces the correct prefix', t => {
  const { getPrefix } = lib()
  t.equals(getPrefix(), 'v')
  t.equals(getPrefix('foo'), 'foo@v')
  t.end()
})

test('it should produce the correct package', async t => {
  const mockedPath = 'packages/foo'
  const { getPackage } = lib({
    globby: () => Promise.resolve([mockedPath]),
    existsSync: () => true,
    core
  })

  const res = await getPackage(
    mockedPath,
    'deno'
  )

  t.assert(mockedPath, res)
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

  const res = await getPackage(
    'foo',
    'deno'
  )

  t.assert(mockedPath, res)
})

test('it should throw an error if more than one package is found', async t => {
  const mockedPath = 'packages/foo'

  const { getPackage } = lib({
    globby: () => Promise.resolve([mockedPath, '/packages/lib/foo']),
    existsSync: () => true,
    core
  })

  await getPackage(
    'foo',
    'deno'
  )
    .then(() => t.fail())
    .catch(err => t.ok(err))
})

test('it should throw an error if no package is found', async t => {
  const { getPackage } = lib({
    globby: () => Promise.resolve([]),
    existsSync: () => true,
    core
  })

  await getPackage(
    'foo',
    'deno'
  )
    .then(() => t.fail())
    .catch(err => t.ok(err))
})

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

  t.equals(res.bumpFiles.length, 1)
})
