var baserequire = require('base-require');
var createBackupper = baserequire('src/backupper/backupper');
var createQueueBackupper = baserequire('src/backupper/queueBackupper');

/**
 * @param {Provider} provider
 * @param {Storage} storage
 * @param {Queue} BeeQueue queue
 * @param {DisplayOutput} displayOutput
 * @returns {BackupperManager}
 */
module.exports = function (provider, storage, queue, displayOutput) {
    var backupper;

    /**
     * @returns {Object}
     */
    function getBackupper() {
        if (!backupper) {
            backupper = createBackupper(
                provider,
                createQueueBackupper(storage, queue, displayOutput)
            );
        }
        return backupper;
    }

    return {
        getBackupper
    };
};
