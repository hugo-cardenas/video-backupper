var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createProviderManager = baserequire('src/provider/providerManager');

var _google;
var _providerManager;

/**
 * @returns {Config} Config object
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {Object} Google API client
 */
function getGoogle() {
    if (!_google) {
        _google = require('googleapis');
    }
    return _google;
}

/**
 * @returns {Provider} Provides video items
 */
function getProviderManager() {
    if (!_providerManager) {
        _providerManager = createProviderManager(getGoogle(), getConfig());
    }
    return _providerManager;
}

module.exports = {
    getProviderManager: getProviderManager
};
