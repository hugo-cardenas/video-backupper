var baserequire = require('base-require');
var outputLocator = baserequire('src/output/outputLocator');
var providerLocator = baserequire('src/provider/providerLocator');
var queueLocator = baserequire('src/queue/queueLocator');
var storageLocator = baserequire('src/backupper/storageLocator');
var createBackupperManager = baserequire('src/backupper/backupperManager');

var _backupperManager;

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    return outputLocator.getDisplayOutput();
}

/**
 * @returns {Provider}
 */
function getProvider() {
    return providerLocator.getProviderManager().getProvider();
}

/**
 * @returns {Queue}
 */
function getQueue() {
    return queueLocator.getQueueManager().getQueue();
}

/**
 * @returns {Object}
 */
function getStorage() {
    return storageLocator.getBackupperStorageManager().getBackupperStorage();
}

/**
 * @returns {BackupperManager}
 */
function getBackupperManager() {
    if (!_backupperManager) {
        _backupperManager = createBackupperManager(
            getProvider(),
            getStorage(),
            getQueue(),
            getDisplayOutput()
        );
    }
    return _backupperManager;
}

/**
 * @param {BackupperManager} backupperManager
 */
function setBackupperManager(backupperManager) {
    _backupperManager = backupperManager;
}

module.exports = {
    getBackupperManager: getBackupperManager,
    setBackupperManager: setBackupperManager
};
