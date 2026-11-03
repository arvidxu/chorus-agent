import testIsolation from './test-isolation.cjs'

export function setup() {
  return testIsolation.isolateTestEnvironment()
}
