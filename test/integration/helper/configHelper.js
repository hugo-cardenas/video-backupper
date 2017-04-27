const sinon = require('sinon');
const baserequire = require('base-require');
const configLocator = baserequire('src/config/configLocator');
const createConfig = baserequire('src/config/config');

/**
 * Merge a config plain object into the existing config, overriding any colliding properties
 * @param {Object} config Key-value config object
 */
function overrideConfig(config) {
    var currentConfig = getConfigValue('');
    var newConfig = Object.assign(currentConfig, config);
    configLocator.getConfigManager().getConfig = sinon.stub();
    configLocator.getConfigManager().getConfig.returns(createConfig(newConfig));
}

/**
 * @param {string} key
 * @returns {string|number|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

module.exports = {
    getConfigValue,
    overrideConfig
};
