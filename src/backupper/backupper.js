/**
 * @typedef {Object} Backupper
 *
 * @property {function} run Run the backup process
 */

var VError = require('verror');

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

            return storage.save(stream, playlistId, videoId)
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
        var message = 'Backup failed for video id ' + videoId;
        var err = new VError(previousErr, message);
        displayOutput.outputLine(err.message);
        return err;
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
        var promiseFunctions = videoItems.map(function (videoItem) {
            return backup.bind(this, playlistId, videoItem.resourceId.videoId);
        });

        return resolvePromisesInSeries(promiseFunctions);
    }

    /**
     * Resolve promise functions in series and collect all the errors
     *
     * @param {function[]} promises Array of functions which return promise
     * @returns {Promise<Error[]>} Resolves with an array of errors (if any)
     */
    function resolvePromisesInSeries(promises) {
        var executePromiseAndCollectError = function (promise, errors) {
            return new Promise(function (resolve, reject) {
                promise()
                    .then(function () {
                        return resolve(errors);
                    })
                    .catch(function (err) {
                        errors.push(err);
                        return resolve(errors);
                    });
            });
        };

        var reduceFunction = function (previousPromise, currentPromise) {
            return previousPromise
                .then(function (errors) {
                    return executePromiseAndCollectError(currentPromise, errors);
                });
        };

        return promises.reduce(reduceFunction, Promise.resolve([]));
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
