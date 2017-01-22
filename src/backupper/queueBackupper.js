var VError = require('verror');
var _ = require('lodash');
var removeDiacritics = require('diacritics').remove;

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

    function formatVideoItems(videoItems) {
        return videoItems.map(function (videoItem) {
            return {
                videoId: videoItem.videoId,
                videoName: formatStringToSafeChars(videoItem.videoName),
                playlistId: videoItem.playlistId,
                playlistName: formatStringToSafeChars(videoItem.playlistName)
            };
        });
    }

    function formatStringToSafeChars(str) {
        var charsToEncode = /[\u007f-\uffff]/g;
        return removeDiacritics(str)
            .replace(/[\/\\]/g, '-')
            // https://github.com/dropbox/dropbox-sdk-js/pull/87
            .replace(charsToEncode, function (c) {
                return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
            });
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
            .then(formatVideoItems) // TODO When filtering videos by id, this won't be needed
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
