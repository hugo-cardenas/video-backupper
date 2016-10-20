var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');

/**
 * @returns {Config}
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {boolean}
 */
function isIntegrationTestEnabled() {
    try {
        return getConfig().get('integrationTestEnabled') === true;
    } catch (err) {
        return false;
    }
}

module.exports = {
    isIntegrationTestEnabled: isIntegrationTestEnabled
};
