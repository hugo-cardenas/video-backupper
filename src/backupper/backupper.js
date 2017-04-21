const VError = require('verror');

/**
 * Create the main backupper (entry point)
 *
 * @param {Object} provider
 * @param {Object} queueBackupper
 * @param {Object} displayOutput
 * @returns {Object}
 */
module.exports = function (provider, queueBackupper) {
    /**
     * Run the backup process for all the videos in the playlist specified
     * @param {string} playlistId
     * @returns {Promise} No resolve value
     */
    function backupPlaylist(playlistId) {
        return provider.getPlaylistVideoItems(playlistId)
            .then(backupVideos)
            .catch(function (err) {
                throw createPlaylistBackupError(err, playlistId);
            });
    }

    /**
     * Run the backup process for all the videos in the channel specified
     * @param {string} channelId
     * @returns {Promise} No resolve value
     */
    function backupChannel(channelId) {
        return provider.getChannelVideoItems(channelId)
            .then(backupVideos)
            .catch(function (err) {
                throw createChannelBackupError(err, channelId);
            });
    }

    function backupVideos(videos) {
        return queueBackupper.backupVideos(videos);
    }

    /**
     * @param {Error} err
     * @param {string} playlistId
     * @returns {Error}
     */
    function createPlaylistBackupError(err, playlistId) {
        return VError(err, 'Failed to backup playlist %s', playlistId);
    }

    /**
     * @param {Error} err
     * @param {string} channelId
     * @returns {Error}
     */
    function createChannelBackupError(err, channelId) {
        return VError(err, 'Failed to backup channel %s', channelId);
    }

    return {
        backupPlaylist,
        backupChannel
    };
};
