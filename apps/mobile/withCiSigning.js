const { withXcodeProject } = require('expo/config-plugins')

module.exports = (expoConfig) =>
  withXcodeProject(expoConfig, (config) => {
    const project = config.modResults
    const { target } = project.getTarget('com.apple.product-type.application')
    const configurations = project.pbxXCConfigurationList()[target.buildConfigurationList]
    const settings = project.pbxXCBuildConfigurationSection()

    for (const { value } of configurations.buildConfigurations) {
      if (settings[value].name !== 'Release') {
        continue
      }
      Object.assign(settings[value].buildSettings, {
        CODE_SIGN_STYLE: 'Manual',
        CODE_SIGN_IDENTITY: '"Apple Distribution"',
        DEVELOPMENT_TEAM: process.env.CI_IOS_TEAM_ID,
        PROVISIONING_PROFILE_SPECIFIER: process.env.CI_IOS_PROFILE_UUID,
      })
    }
    return config
  })
