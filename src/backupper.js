/**
 * @typedef {Object} Backupper
 *
 * @property {function} run Run the backup process
 */

/**
 * Create a backupper
 *
 * @param {Provider} provider Provider of video items
 * @param {Object} ytdl Library for downloading videos
 * @param {Storage} storage Storage for saving videos
 * @param {DisplayOutput} displayOutput Object to output messages
 * @returns {Backupper}
 */
module.exports = function (provider, ytdl, storage, displayOutput) {
    // TODO Use proper query build
    var baseVideoUrl = 'https://www.youtube.com/watch?v=';

    /**
     * @param {string} videoId
     * @returns {string}
     */
    function buildVideoUrl(videoId) {
        return baseVideoUrl + videoId;
    }

    /**
     * Backup one specific video (download and save)
     *
     * @param {string} playlistId Playlist to which the video belongs
     * @param {string} videoId
     * @returns {Promise}
     */
    function backup(playlistId, videoId) {
        return new Promise(function (resolve, reject) {
            try {
                var url = buildVideoUrl(videoId);
                var stream = ytdl(url);
            } catch (err) {
                return reject(createError(videoId, err));
            }

            storage.save(stream, playlistId, videoId)
                .then(function () {
                    displayOutput.outputLine('Success saving video ' + videoId);
                    return resolve();
                })
                .catch(function (err) {
                    return reject(createError(videoId, err));
                });
        });
    }

    /**
     * Create a backup specific error
     *
     * @param {string} videoId
     * @param {Error} previousErr
     * @returns {Error}
     */
    function createError(videoId, previousErr) {
        var message = 'Backup failed for video id: ' + videoId + ', reason: ' + previousErr.message;
        displayOutput.outputLine(message);
        return new Error(message);
    }

    /**
     * Launch in parallel all video backups.
     * If there are errors, it will collect them and still try to backup all videos.
     *
     * @param {string} playlistId
     * @param {Object[]} videoItems Video item object list
     * @returns {Promise<Error[]>} Promise which resolves with a list of errors (empty if none)
     */
    function backupVideoItems(playlistId, videoItems) {
        var promises = videoItems.map(function (videoItem) {
            return backup(playlistId, videoItem.resourceId.videoId);
        });

        var solvedPromises = promises.map(function (promise) {
            return promise
                .then(function () {
                    return Promise.resolve();
                })
                .catch(function (err) {
                    return Promise.resolve(err);
                });
        });

        return Promise.all(solvedPromises)
            .then(function (errors) {
                return Promise.resolve(errors.filter(function (e) {
                    return e;
                }));
            });
    }

    /**
     * Run the backup process for all the videos in the playlist specified
     *
     * @param {string} playlistId
     * @returns {Promise<Error[]>} Promise which resolves with a list of errors (empty if none)
     */
    function run(playlistId) {
        return provider.getVideoItems(playlistId)
            .then(function (videoItems) {
                displayOutput.outputLine('Found ' + videoItems.length + ' video items');
                return backupVideoItems(playlistId, videoItems);
            });
    }

    return {
        run: run
    };
};
