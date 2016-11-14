var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var outputLocator = baserequire('src/output/outputLocator');
var storageLocator = baserequire('src/storage/storageLocator');
var createQueueManager = baserequire('src/queue/queueManager');

var _ytdl;
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
 * @param {Object} queueManager
 */
function setQueueManager(queueManager) {
    _queueManager = queueManager;
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
    return outputLocator.getDisplayOutput();
}

module.exports = {
    getQueueManager: getQueueManager,
    setQueueManager: setQueueManager
};
