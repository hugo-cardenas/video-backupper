const VError = require('verror');
const _ = require('lodash');

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
     * Run the backup process for all the videos in the playlist specified
     * @param {string} playlistId
     * @returns {Promise} No resolve value
     */
    function run(playlistId) {
        return provider.getPlaylistVideoItems(playlistId)
            .then(processVideoItems)
            .catch(function (err) {
                return Promise.reject(createErrorForPlaylist(playlistId, err));
            });
    }

    function backupChannel(userId) {
        return getChannelVideoItems(userId)
            .then(processVideoItems)
            .catch(function (err) {
                return Promise.reject(createErrorForChannel(userId, err));
            });
    }

    function processVideoItems(videoItems) {
        displayOutput.outputLine('Found ' + videoItems.length + ' video items');
        return formatVideoItems(videoItems) // TODO Should be moved to storage when comparison is done properly by id
            .then(filterVideoItems)
            .then(function (videoItems) {
                displayOutput.outputLine('Creating save jobs for ' + videoItems.length + ' video items');
                return videoItems;
            })
            .then(queueVideoItems);
    }

    /**
     * @param {Object[]} videoItems
     */
    function formatVideoItems(videoItems) {
        var formattedVideoItems = videoItems.map(function (videoItem) {
            return Object.assign({}, videoItem, {
                name: formatStringToSafeChars(videoItem.name),
                playlistName: formatStringToSafeChars(videoItem.playlistName)
            });
        });
        return Promise.resolve(formattedVideoItems);
    }

    /**
     * @param {string} str
     */
    function formatStringToSafeChars(str) {
        return str.replace(/[/\\]/g, '-');
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
                    return videoItem.id === storedVideoItem.id;
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
     * Create a backup specific error
     * @param {string} playlistId
     * @param {Error} previousErr
     * @returns {Error}
     */
    function createErrorForPlaylist(playlistId, previousErr) {
        var message = 'Failed to create backup jobs for playlist id ' + playlistId;
        var err = new VError(previousErr, message);
        displayOutput.outputLine(err.message);
        return err;
    }

    /**
     * Create a backup specific error
     * @param {string} playlistId
     * @param {Error} previousErr
     * @returns {Error}
     */
    function createErrorForChannel(channelId, previousErr) {
        var message = 'Failed to create backup jobs for channel id ' + channelId;
        var err = new VError(previousErr, message);
        displayOutput.outputLine(err.message);
        return err;
    }

    return {
        run: run
    };
};
