var baserequire = require('base-require');
var createBackupperStorageManager = baserequire('src/backupper/storageManager');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');

var _backupperStorageManager;

/**
 * @returns {Object}
 */
function getBackupperStorageManager() {
    if (!_backupperStorageManager) {
        _backupperStorageManager = createBackupperStorageManager(
            configLocator.getConfigManager().getConfig(),
            storageLocator.getStorageManager()
        );
    }
    return _backupperStorageManager;
}

/**
 * @param {Object} backupperStorageManager
 */
function setBackupperStorageManager(backupperStorageManager) {
    _backupperStorageManager = backupperStorageManager;
}

module.exports = {
    getBackupperStorageManager: getBackupperStorageManager,
    setBackupperStorageManager: setBackupperStorageManager
};
