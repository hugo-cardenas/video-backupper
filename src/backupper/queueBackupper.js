const VError = require('verror');
const _ = require('lodash');

/**
 * Create a backupper
 *
 * @param {Storage} storage Video storage
 * @param {Object} queue Job queue
 * @param {DisplayOutput} displayOutput Object to output messages
 * @returns {Backupper}
 */
module.exports = function (storage, queue, displayOutput) {
    /**
     * Run the backup process for the videos specified
     * @param {Object[]} videos
     * @returns {Promise} No resolve value
     */
    function backupVideos(videos) {
        displayOutput.outputLine('Processing ' + videos.length + ' video items');
        return Promise.resolve()
            .then(function () {
                validateVideoItems(videos);
                return videos;
            })
            .then(formatVideoItems)  // TODO Should be moved to storage when comparison is done properly by id
            .then(filterVideoItems)
            .then(function (videos) {
                displayOutput.outputLine('Creating save jobs for ' + videos.length + ' video items');
                return videos;
            })
            .then(queueVideoItems)
            .catch(function (err) {
                return Promise.reject(createError(videos, err));
            });
    }

    /**
     * @param {any} videos
     */
    function validateVideoItems(videos) {
        const mandatoryProperties = ['id', 'name', 'playlistName', 'url'];
        videos.forEach(function (video) {
            const invalidProperties = mandatoryProperties.filter(function (property) {
                return !video[property] || typeof video[property] !== 'string';
            });
            if (invalidProperties.length > 0) {
                throw new VError(
                    'Invalid video %s, invalid or missing properties [%s]',
                    JSON.stringify(video),
                    invalidProperties.join(', ')
                );
            }
        });
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
     * @param {Object[]} videos
     * @param {Error} previousErr
     * @returns {Error}
     */
    function createError(videos, previousErr) {
        var err = new VError(previousErr, 'Failed to create backup jobs for %d videos', videos.length);
        displayOutput.outputLine(err.message);
        return err;
    }

    return {
        backupVideos: backupVideos
    };
};
