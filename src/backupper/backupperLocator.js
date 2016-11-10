var baserequire = require('base-require');

var createDisplayOutput = baserequire('src/output/displayOutput');

var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');
var providerLocator = baserequire('src/provider/providerLocator');
var queueLocator = baserequire('src/queue/queueLocator');

var createBackupperManager = baserequire('src/backupper/backupperManager');

var _ytdl;
var _displayOutput;
var _backupperManager;

/**
 * @returns {Config
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

/**
 * @returns {Provider}
 */
function getProvider() {
    return providerLocator.getProviderManager().getProvider();
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
 * @returns {StorageManager}
 */
function getStorageManager() {
    return storageLocator.getStorageManager();
}

/**
 * @returns {Queue}
 */
function getQueue() {
    return queueLocator.getQueueManager().getQueue();
}

/**
 * @returns {BackupperManager}
 */
function getBackupperManager() {
    if (!_backupperManager) {
        _backupperManager = createBackupperManager(
            getConfig(), getProvider(), getYtdl(), getStorageManager(), getQueue(), getDisplayOutput()
        );
    }
    return _backupperManager;
}

module.exports = {
    getDisplayOutput: getDisplayOutput,
    setDisplayOutput: setDisplayOutput,
    getBackupperManager: getBackupperManager
};
