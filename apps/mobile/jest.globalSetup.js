const { isolateTestEnvironment } = require('../../scripts/test/test-isolation.cjs')

module.exports = () => {
  globalThis.__restoreTestEnvironment = isolateTestEnvironment()
}
