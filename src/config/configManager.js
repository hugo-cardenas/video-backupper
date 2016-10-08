var jsonfile = require('jsonfile');

/**
 * @typedef {Object} ConfigManager
 *
 * @property {function} getConfig Get the config object
 */

module.exports = function () {
    var config = null;

    /**
     * Load the config object from file
     *
     * @returns {Object} Config object
     */
    function loadConfig() {
        if (!process.env.VIDEOBACKUPPER_CONFIG) {
            throw new Error('VIDEOBACKUPPER_CONFIG env var should contain path to configuration file');
        }
        return jsonfile.readFileSync(process.env.VIDEOBACKUPPER_CONFIG);
    }

    // TODO Make this robust on missing keys

    /**
     * @returns {Object} Config object
     */
    function getConfig() {
        if (config === null) {
            config = loadConfig();
        }
        return config;
    }

    return {
        getConfig: getConfig
    };
};
