var jsonfile = require('jsonfile');
var VError = require('verror');
var baserequire = require('base-require');
var createConfig = baserequire('src/config/config');

/**
 * @typedef {Object} ConfigManager
 *
 * @property {function} getConfig Get the config object
 */

module.exports = function () {
    var config;

    /**
     * Load the config object from file
     *
     * @returns {Object} Config object
     */
    function loadConfig() {
        if (!process.env.VIDEOBACKUPPER_CONFIG) {
            throw new Error('VIDEOBACKUPPER_CONFIG env var should contain path to configuration file');
        }

        try {
            var file = process.env.VIDEOBACKUPPER_CONFIG;
            var config = jsonfile.readFileSync(file);
        } catch (err) {
            throw new VError(err, 'Unable to read config file ' + file);
        }

        if (typeof config !== 'object') {
            throw new Error('Invalid config file ' + file + ', JSON is not an object');
        }
        return createConfig(config);
    }

    /**
     * @returns {Object} Config object
     */
    function getConfig() {
        if (!config) {
            config = loadConfig();
        }
        return config;
    }

    return {
        getConfig: getConfig
    };
};
