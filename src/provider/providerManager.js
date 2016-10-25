var VError = require('verror');
var baserequire = require('base-require');
var createProvider = baserequire('src/provider/provider');

/**
 * @typedef {Object} ProviderManager
 *
 * @property {function} getProvider Get provider object
 */

/**
 * @param {Object} google Google client object
 * @param {Config} config Config object
 * @returns {ProviderManager}
 */
module.exports = function (google, config) {
    const PROVIDER_CONFIG = 'provider.youtube';

    var provider;

    /**
     * @returns {Provider}
     * @throws {Error} If config is invalid
     */
    function getProvider() {
        if (!provider) {
            provider = createProvider(google, getProviderConfig());
        }
        return provider;
    }

    /**
     * @returns {Object} Plain config Object
     * @throws {Error} If config is invalid
     */
    function getProviderConfig() {
        try {
            return config.get(PROVIDER_CONFIG);
        } catch (err) {
            throw new VError(err, 'Unable to create provider');
        }
    }

    return {
        getProvider: getProvider
    };
};
