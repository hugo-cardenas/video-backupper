const VError = require('verror');
const _ = require('lodash');
const baserequire = require('base-require');
const createVideo = baserequire('src/video/video');

/**
 * Create a backupper
 *
 * @param {Provider} provider Provider of video items
 * @param {Storage} storage Video storage
 * @param {Object} queue Job queue
 * @param {DisplayOutput} displayOutput Object to output messages
 * @returns {Backupper}
 */
module.exports = function (provider, storage, queue, displayOutput) {
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
        return provider.getVideoItems(playlistId);
    }

    /**
     * @param {Object[]} videoItems
     */
    function formatVideoItems(videoItems) {
        return videoItems.map(function (videoItem) {
            return createVideo(
                videoItem.videoId,
                formatStringToSafeChars(videoItem.videoName),
                videoItem.playlistId,
                formatStringToSafeChars(videoItem.playlistName)
            );
        });
    }

    /**
     * @param {string} str
     */
    function formatStringToSafeChars(str) {
        return str.replace(/[\/\\]/g, '-');
    }

    /**
     * Filter provided video items, excluding those which are already stored
     *
     * @param {Object[]} videoItems
     * @returns {Promise<Object[]>}
     */
    function filterVideoItems(videoItems) {
        if (videoItems.length === 0) {
            return Promise.resolve([]);
        }
        return storage.getAllVideoItems()
            .then(function (storedVideoItems) {
                return _.differenceWith(videoItems, storedVideoItems, function (videoItem, storedVideoItem) {
                    return videoItem.playlistName === storedVideoItem.playlistName &&
                        videoItem.videoName === storedVideoItem.videoName;
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
            displayOutput.outputLine('Created job ' + JSON.stringify(videoItem));
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
            .then(formatVideoItems) // TODO Should be moved to storage when comparison is done properly by id
            .then(filterVideoItems)
            .then(function (videoItems) {
                displayOutput.outputLine('Creating save jobs for ' + videoItems.length + ' video items');
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
