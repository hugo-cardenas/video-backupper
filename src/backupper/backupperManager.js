var baserequire = require('base-require');
var createQueueBackupper = baserequire('src/backupper/queueBackupper');

/**
 * @typedef {Object} BackupperManager
 *
 * @property {function} getBackupper Get backupper object
 */

/**
 * @param {Provider} provider
 * @param {Storage} storage
 * @param {Queue} BeeQueue queue
 * @param {DisplayOutput} displayOutput
 * @returns {BackupperManager}
 */
module.exports = function (provider, storage, queue, displayOutput) {
    var queueBackupper;

    /**
     * @returns {QueueBackupper}
     */
    function getQueueBackupper() {
        if (!queueBackupper) {
            queueBackupper = createQueueBackupper(provider, storage, queue, displayOutput);
        }
        return queueBackupper;
    }

    return {
        getQueueBackupper: getQueueBackupper
    };
};
