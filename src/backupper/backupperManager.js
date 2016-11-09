var VError = require('verror');
var baserequire = require('base-require');
var createBackupper = baserequire('src/backupper/backupper');
var createQueueBackupper = baserequire('src/backupper/queueBackupper');

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
 * @param {Queue} BeeQueue queue
 * @param {DisplayOutput} displayOutput
 * @returns {BackupperManager}
 */
module.exports = function (config, provider, ytdl, storageManager, queue, displayOutput) {
    var CONFIG_BACKUPPER_STORAGE = 'backupper.storage';

    var backupper;
    var queueBackupper;

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
     * @returns {QueueBackupper}
     */
    function getQueueBackupper() {
        if (!queueBackupper) {
            queueBackupper = createQueueBackupper(provider, queue, displayOutput);
        }
        return queueBackupper;
    }

    /**
     * @returns {StorageInterface}
     * @throws {Error} If backupper config is invalid
     */
    function getStorage() {
        try {
            return storageManager.getStorage(config.get(CONFIG_BACKUPPER_STORAGE));
        } catch (err) {
            throw new VError(err, 'Unable to create backupper');
        }
    }

    return {
        getBackupper: getBackupper,
        getQueueBackupper: getQueueBackupper
    };
};
