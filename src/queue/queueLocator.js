var Queue = require('bee-queue');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');
var createDisplayOutput = baserequire('src/output/displayOutput');
var createQueueManager = baserequire('src/queue/queueManager');


var _ytdl;
var _displayOutput;
var _queueManager;

/**
 * @returns {Object}
 */
function getQueueManager() {
    if (!_queueManager) {
        _queueManager = createQueueManager(
            getConfig(), getYtdl(), storageLocator.getStorageManager(), getDisplayOutput()
        );
    }
    return _queueManager;
}

/**
 * @returns {Object} Ytdl library method
 */
function getYtdl() {
    if (!_ytdl) {
        _ytdl = require('ytdl-core');
    }
    return _ytdl;
}

/**
 * @returns {Config}
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    if (!_displayOutput) {
        _displayOutput = createDisplayOutput();
    }
    return _displayOutput;
}

/**
 * @param {DisplayOutput} displayOutput
 */
function setDisplayOutput(displayOutput) {
    _displayOutput = displayOutput;
}

module.exports = {
    getQueueManager: getQueueManager
};
