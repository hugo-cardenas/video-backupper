var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createProvider = baserequire('src/provider/provider');

var _google;
var _provider;

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
 * @param {Object} google Google API client
 */
function setGoogle(google) {
    _google = google;
}

/**
 * @returns {Provider} Provides video items
 */
function getProvider() {
    if (!_provider) {
        _provider = createProvider(getGoogle(), getConfig().provider.youtube);
    }
    return _provider;
}

/**
 * @param {Provider|null} provider
 */
function setProvider(provider) {
    _provider = provider;
}

module.exports = {
    getProvider: getProvider,
    setProvider: setProvider,
    getGoogle: getGoogle,
    setGoogle: setGoogle
};
