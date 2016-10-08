var jsonfile = require('jsonfile');

module.exports = function () {
    var config = null;

    function loadConfig() {
        if (!process.env.VIDEOBACKUPPER_CONFIG) {
            throw new Error('VIDEOBACKUPPER_CONFIG env var should contain path to configuration file');
        }
        return jsonfile.readFileSync(process.env.VIDEOBACKUPPER_CONFIG);
    }

    // TODO Make this robust on missing keys
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
