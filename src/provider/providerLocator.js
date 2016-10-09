var google = require('googleapis');

var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createProvider = baserequire('src/provider/provider');

var provider;

/**
 * @returns {Config} Config object
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {Provider} Provides video items
 */
function getProvider() {
    if (!provider) {
        provider = createProvider(google, getConfig());
    }
    return provider;
}

module.exports = {
    getProvider: getProvider
};
