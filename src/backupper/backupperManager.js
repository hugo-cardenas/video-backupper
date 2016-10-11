var baserequire = require('base-require');
var createBackupper = baserequire('src/backupper/backupper');

/**
 * @typedef {Object} BackupperManager
 *
 * @property {function} getBackupper Get backupper object
 */

/**
 * @param {Config} config
 * @param {Provider} provider
 * @param {Object} ytdl
 * @param {StorageManager} storageManager
 * @param {DisplayOutput} displayOutput
 * @returns {BackupperManager}
 */
module.exports = function (config, provider, ytdl, storageManager, displayOutput) {
    var CONFIG_BACKUPPER_STORAGE = 'backupper.storage';

    var backupper;

    /**
     * @returns {Backupper}
     * @throws {Error} If backupper config is invalid
     */
    function getBackupper() {
        if (!backupper) {
            backupper = createBackupper(provider, ytdl, getStorage(), displayOutput);
        }
        return backupper;
    }

    /**
     * @returns {StorageInterface}
     * @throws {Error} If backupper config is invalid
     */
    function getStorage() {
        try {
            return storageManager.getStorage(config.get(CONFIG_BACKUPPER_STORAGE));
        } catch (err) {
            throw new Error('Unable to create backupper: ' + err.message);
        }
    }

    return {
        getBackupper: getBackupper
    };
};
