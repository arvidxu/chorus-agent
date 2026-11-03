const { appId, name, applicationName, versions } = require('../../product.conf.json')
const buildNumber = process.env.MOBILE_BUILD_NUMBER

// 2100000000 is the largest versionCode Google Play accepts.
if (
  buildNumber !== undefined &&
  !(/^[1-9]\d*$/.test(buildNumber) && Number(buildNumber) <= 2100000000)
) {
  throw new RangeError(
    `MOBILE_BUILD_NUMBER must be an integer from 1 to 2100000000, got "${buildNumber}". No app config was produced; unset it for local builds, or let scripts/release/mobile.mjs set it in CI.`,
  )
}

module.exports = ({ config }) => ({
  ...config,
  name,
  slug: applicationName,
  scheme: applicationName,
  version: versions.mobile,
  ...(process.env.CI_IOS_PROFILE_UUID
    ? { plugins: [...(config.plugins ?? []), './withCiSigning.js'] }
    : {}),
  ios: {
    ...config.ios,
    bundleIdentifier: appId,
    ...(buildNumber ? { buildNumber } : {}),
  },
  android: {
    ...config.android,
    package: appId,
    ...(buildNumber ? { versionCode: Number(buildNumber) } : {}),
  },
})
