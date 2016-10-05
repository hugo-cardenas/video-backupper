var jsonfile = require('jsonfile');

module.exports = function () {
    var config = null;

    // TODO Make this robust on missing keys
    function getConfig() {
        if (config === null) {
            config = jsonfile.readFileSync(process.env.VIDEOBACKUPPER_CONFIG);
        }
        return config;
    }

    return {
        getConfig: getConfig
    }
}