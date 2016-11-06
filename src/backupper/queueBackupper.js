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
     * @returns {Promise<string[]>} Resolves with array of video ids
     */
    function getVideoIds(playlistId) {
        return provider.getVideoItems(playlistId)
            .then(function (videoItems) {
                return videoItems.map(function (videoItem) {
                    return videoItem.resourceId.videoId;
                });
            });
    }

    /**
     * Create jobs for backupping list of video ids, add jobs to queue
     * @param {string[]} videoIds
     */
    function queueVideoIds(videoIds) {
        videoIds.forEach(function (id) {
            queue.createJob(createJobObject(id)).save();
        });
    }

    /**
     * @param {string} videoId
     * @returns {Object}
     */
    function createJobObject(videoId) {
        return { videoId: videoId };
    }

    /**
     * Run the backup process for all the videos in the playlist specified
     * @param {string} playlistId
     * @returns {Promise} No resolve value
     */
    function run(playlistId) {
        return getVideoIds(playlistId)
            .then(queueVideoIds)
            .catch(function (err) {
                return Promise.reject(createError(playlistId, err));
            });
    }

    return {
        run: run
    };
};
