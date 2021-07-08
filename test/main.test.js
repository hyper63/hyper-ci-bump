
const test = require('tape')

const { getRuntimeDefaults, getPrefix, getPackage, filterRuntimeDefaults } = require('../main')

const core = {
  info: () => {}
}

test('it produces correct runtime defaults', t => {
  let res = getRuntimeDefaults('node')

  t.equals(res.bumpFiles[0].filename, 'package.json')

  res = getRuntimeDefaults('deno')

  t.equals(res.bumpFiles[0].filename, 'egg.json')
  t.end()
})

test('it produces the correct prefix', t => {
  t.equals(getPrefix(), 'v')
  t.equals(getPrefix('foo'), 'foo@v')
  t.end()
})

test('it should produce the correct package', async t => {
  const mockedPath = 'packages/foo'

  const res = await getPackage(
    mockedPath,
    'deno',
    () => Promise.resolve([mockedPath]),
    () => true,
    core
  )

  t.assert(mockedPath, res)
})

test('it should produce the correct package from multiple', async t => {
  const mockedPath = 'packages/foo'

  const queue = [true, false]
  const mockedExistsSync = () => {
    return queue.shift()
  }

  const res = await getPackage(
    'foo',
    'deno',
    () => Promise.resolve([mockedPath, '/packages/lib/foo']),
    mockedExistsSync,
    core
  )

  t.assert(mockedPath, res)
})

test('it should throw an error if more than one package is found', async t => {
  const mockedPath = 'packages/foo'

  await getPackage(
    'foo',
    'deno',
    () => Promise.resolve([mockedPath, '/packages/lib/foo']),
    () => true,
    core
  )
    .then(() => t.fail())
    .catch(err => t.ok(err))
})

test('it should throw an error if no package is found', async t => {
  await getPackage(
    'foo',
    'deno',
    () => Promise.resolve([]),
    () => true,
    core
  )
    .then(() => t.fail())
    .catch(err => t.ok(err))
})

test('it should filter the bumpFiles', async t => {
  const queue = [true, false]
  const mockedExistsSync = () => {
    return queue.shift()
  }

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
    },
    mockedExistsSync
  )

  t.equals(res.bumpFiles.length, 1)
})
