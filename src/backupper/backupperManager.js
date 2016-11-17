var VError = require('verror');
var baserequire = require('base-require');
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
module.exports = function (provider, queue, displayOutput) {
    var queueBackupper;

    /**
     * @returns {QueueBackupper}
     */
    function getQueueBackupper() {
        if (!queueBackupper) {
            queueBackupper = createQueueBackupper(provider, queue, displayOutput);
        }
        return queueBackupper;
    }

    return {
        getQueueBackupper: getQueueBackupper
    };
};
