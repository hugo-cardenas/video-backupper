var VError = require('verror');
var baserequire = require('base-require');
var validateVideoItem = baserequire('src/storage/videoItemValidator');

/**
 * @typedef {Object} Storage
 *
 * @property {function} save Save a stream in S3
 */

/**
 * Create an S3 storage
 *
 * @param {Object} s3 S3 client object
 * @param {Object} config Plain config object
 * @returns {Object}
 */
module.exports = function (s3, config) {
    var extension = 'mp4';

    validateConfig(config);

    /**
     * Validate input storage config
     *
     * @param {Object} config Plain config object
     * @throws {Error}
     */
    function validateConfig(config) {
        if (!config.bucket) {
            throw new VError('Error creating s3 storage: Invalid config.bucket value %s ', JSON.stringify(config.bucket));
        }
    }

    /**
     * Build the S3 key (path)
     *
     * @param {Object} videoItem
     * @returns {string}
     */
    function buildKey(videoItem) {
        return videoItem.playlistName + '/' + videoItem.videoName + '.' + extension;
    }

    /**
     * @param {Object} params
     * @returns {Promise}
     */
    function s3Upload(params) {
        return new Promise(function (resolve, reject) {
            s3.upload(params, function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    /**
     * @param {Object} videoItem
     * @param {Error} err
     * @returns {Error}
     */
    function createError(videoItem, err) {
        return new VError(err, 'S3 storage unable to save stream for videoItem %s', JSON.stringify(videoItem));
    }

    /**
     * Save the stream identified by the specified playlistId and videoId
     *
     * @param {Stream} stream
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {Promise}
     */
    function save(stream, videoItem) {
        // TODO Get list of stored files
        // Only if not stored already, save
        return Promise.resolve()
            .then(function () {
                validateVideoItem(videoItem);
            })
            .then(function () {
                var params = {
                    Bucket: config.bucket,
                    Key: buildKey(videoItem),
                    Body: stream
                };
                return s3Upload(params);
            })
            .catch(function (err) {
                return Promise.reject(createError(videoItem, err));
            });
    }

    return {
        save: save
    };
};
