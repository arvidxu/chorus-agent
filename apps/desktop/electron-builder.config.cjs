const { updates } = require('../../product.conf.json')

// {releasesRepository} in an update feed is the releases repository in CI; a feed that still has
// a placeholder is left out, so local builds check for nothing.
const releasesRepository = process.env.RELEASES_REPOSITORY
const fill = (text) =>
  releasesRepository ? text.replaceAll('{releasesRepository}', releasesRepository) : text
const updateFeeds = updates.feeds
  .map(({ url, page }) => ({ url: fill(url), page: fill(page) }))
  .filter(({ url, page }) => !`${url}${page}`.includes('{'))

module.exports = {
  // The first feed also makes electron-builder write the update info files.
  ...(updateFeeds.length > 0 ? { publish: { provider: 'generic', url: updateFeeds[0].url } } : {}),
  extraMetadata: {
    updateFeeds,
    // Squirrel.Mac installs updates only into a signed app.
    installsUpdatesOnMac: Boolean(process.env.CSC_LINK),
  },
}
