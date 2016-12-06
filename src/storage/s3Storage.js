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
    function createSaveError(videoItem, err) {
        return new VError(err, 'S3 storage unable to save stream for videoItem %s', JSON.stringify(videoItem));
    }

    /**
     * Save the stream identified by the specified playlistId and videoId
     *
     * @param {Stream} stream
     * @param {Object} videoItem
     * @returns {Promise}
     */
    function save(stream, videoItem) {
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
                return Promise.reject(createSaveError(videoItem, err));
            });
    }

    /**
     * @returns {Promise<Object[]>} Resolves with array of stored video items
     */
    function getAllVideoItems() {
        return getAllKeys()
            .then(function (keys) {
                return keys.map(buildVideoItemFromKey);
            })
            .catch(function (err) {
                return Promise.reject(createGetAllVideoItemsError(err));
            });
    }

    /**
     * @returns {Promise<string[]>} Resolves with list of S3 keys
     */
    function getAllKeys() {
        var params = { Bucket: config.bucket };
        return s3List(params)
            .then(parseListKeysResponseData);
    }

    /**
     * @param {Object} data Response data from S3 client
     * @returns {string[]} Array of S3 keys
     */
    function parseListKeysResponseData(data) {
        try {
            return data.Contents.map(function (elem, index) {
                var key = elem.Key;
                if (key === undefined) {
                    throw new VError('Undefined key at index %d', index);
                }
                return key;
            });
        } catch (err) {
            throw new VError(err, 'Unable to parse list response data %s', JSON.stringify(data));
        }
    }

    /**
     * @param {Object} params
     * @returns {Promise<Object>} Resolves with response data object from S3 client
     */
    function s3List(params) {
        return new Promise(function (resolve, reject) {
            s3.listObjectsV2(params, function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    /**
     * @param {any} key
     * @returns {Object} Video item object
     */
    function buildVideoItemFromKey(key) {
        var parts = key.split('/');
        // Example: /playlistFoo/videoBar
        if (parts[1] && parts[2]) {
            return {
                playlistName: parts[1],
                videoName: parts[2]
            };
        }
        throw new VError('Invalid key "%s"', JSON.stringify(key));
    }

    /**
     * @param {Error} err
     * @returns {Error}
     */
    function createGetAllVideoItemsError(err) {
        return new VError(err, 'S3 storage unable to get all video items');
    }

    return {
        getAllVideoItems: getAllVideoItems,
        save: save
    };
};
