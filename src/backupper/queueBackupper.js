var VError = require('verror');

/**
 * Create a backupper
 *
 * @param {Provider} provider Provider of video items
 * @param {Object} queue
 * @param {DisplayOutput} displayOutput Object to output messages
 * @returns {Backupper}
 */
module.exports = function (provider, queue, displayOutput) {
    /**
     * Create a backup specific error
     * @param {string} playlistId
     * @param {Error} previousErr
     * @returns {Error}
     */
    function createError(playlistId, previousErr) {
        var message = 'Failed to create backup jobs for playlist id ' + playlistId;
        var err = new VError(previousErr, message);
        displayOutput.outputLine(err.message);
        return err;
    }

    /**
     * @param {string} playlistId
     * @returns {Promise<string[]>} Resolves with array of video items
     */
    function getVideoItems(playlistId) {
        return provider.getVideoItems(playlistId)
            .then(function (videoItems) {
                return videoItems.map(function (videoItem) {
                    // TODO This responsibility should be moved to provider
                    return {
                        videoId: videoItem.resourceId.videoId,
                        playlistId: playlistId
                    };
                });
            });
    }

    /**
     * Create jobs for backupping list of video items, add jobs to queue
     * @param {Object[]} videoItems
     */
    function queueVideoItems(videoItems) {
        videoItems.forEach(function (videoItem) {
            queue.createJob(videoItem).save();
        });
    }

    /**
     * Run the backup process for all the videos in the playlist specified
     * @param {string} playlistId
     * @returns {Promise} No resolve value
     */
    function run(playlistId) {
        return getVideoItems(playlistId)
            .then(function (videoItems) {
                displayOutput.outputLine('Found ' + videoItems.length + ' video items');
                return videoItems;
            })
            .then(queueVideoItems)
            .catch(function (err) {
                return Promise.reject(createError(playlistId, err));
            });
    }

    return {
        run: run
    };
};
