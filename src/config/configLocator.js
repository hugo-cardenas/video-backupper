var baserequire = require('base-require');
var createConfigManager = baserequire('src/config/configManager');

var _configManager;

/**
 * @returns {ConfigManager}
 */
function getConfigManager() {
    if (!_configManager) {
        _configManager = createConfigManager();
    }
    return _configManager;
}

/**
 * @param {ConfigManager|null} configManager
 */
function setConfigManager(configManager) {
    _configManager = configManager;
}

module.exports = {
    getConfigManager: getConfigManager,
    setConfigManager: setConfigManager
};
