const {
  appId,
  name,
  applicationName,
  versions,
  companyName,
  companyEmail,
  description,
  homepage,
  updates,
} = require('../../product.conf.json')

// {releasesRepository} in an update feed is the releases repository in CI; a feed that still has
// a placeholder is left out, so local builds check for nothing.
const releasesRepository = process.env.RELEASES_REPOSITORY
const fill = (text) =>
  releasesRepository ? text.replaceAll('{releasesRepository}', releasesRepository) : text
const updateFeeds = updates.feeds
  .map(({ url, page }) => ({ url: fill(url), page: fill(page) }))
  .filter(({ url, page }) => !`${url}${page}`.includes('{'))

module.exports = {
  appId,
  // The first feed also makes electron-builder write the update info files.
  ...(updateFeeds.length > 0 ? { publish: { provider: 'generic', url: updateFeeds[0].url } } : {}),
  // Linux packages and the Linux executable are named after the product, not after this package.
  linux: { executableName: applicationName },
  deb: { packageName: applicationName },
  rpm: { packageName: applicationName },
  extraMetadata: {
    author: { name: companyName, email: companyEmail },
    description,
    // Required for Linux packages.
    homepage,
    version: versions.desktop,
    productName: name,
    updateFeeds,
    // Squirrel.Mac installs updates only into a signed app.
    installsUpdatesOnMac: Boolean(process.env.CSC_LINK),
  },
  electronFuses: {
    runAsNode: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    grantFileProtocolExtraPrivileges: false,
    enableCookieEncryption: true,
    // Flipping fuses breaks the ad-hoc signature, and Apple silicon kills an app whose signature
    // does not match, so an unsigned build would not start. Real signing replaces this signature.
    resetAdHocDarwinSignature: true,
  },
}
