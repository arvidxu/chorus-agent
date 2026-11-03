// Release steps called by .github/workflows/build.yml, test-and-lint.yml, and retry.yml: node scripts/release/release.mjs <step> [argument].
import { cleanup } from './shared.mjs'
import { check, checkTag, plan, writeRunners } from './plan.mjs'
import { desktopPackage } from './desktop.mjs'
import { mobileBuild } from './mobile.mjs'
import { publish } from './publish.mjs'
import { retry } from './retry.mjs'
import { appStore, googlePlay } from './stores.mjs'

const steps = {
  'check-tag': checkTag,
  plan,
  check,
  runners: writeRunners,
  'desktop-package': desktopPackage,
  'mobile-build': mobileBuild,
  publish,
  'google-play': googlePlay,
  'app-store': appStore,
  cleanup,
  retry,
}
const [step, argument] = process.argv.slice(2)
if (!steps[step]) {
  throw new Error(
    `Usage: node scripts/release/release.mjs <${Object.keys(steps).join('|')}> [argument]`,
  )
}
await steps[step](argument)
