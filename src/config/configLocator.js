var baserequire = require('base-require');
var createConfigManager = baserequire('src/config/configManager');

var configManager;

/**
 * @returns {ConfigManager}
 */
function getConfigManager() {
    if (!configManager) {
        configManager = createConfigManager();
    }
    return configManager;
}

module.exports = {
    getConfigManager: getConfigManager
};
