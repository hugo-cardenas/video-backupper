var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var outputLocator = baserequire('src/output/outputLocator');

/**
 * @returns {Config}
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {boolean}
 */
function isIntegrationTestEnabled() {
    try {
        return getConfig().get('integrationTestEnabled') === true;
    } catch (err) {
        return false;
    }
}

function setUp() {
    disableDisplayOutput();
}

function disableDisplayOutput() {
    var displayOutput = {
        outputLine: function () {}
    };
    outputLocator.setDisplayOutput(displayOutput);
}

module.exports = {
    isIntegrationTestEnabled: isIntegrationTestEnabled,
    setUp: setUp
};
