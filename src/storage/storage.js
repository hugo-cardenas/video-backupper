/**
 * @typedef {Object} Storage
 *
 * @property {function} save Save a stream in S3
 */

/**
 * Create an S3 storage
 *
 * @param {Object} s3 S3 client object
 * @param {any} bucket S3 bucket where to store the files
 * @returns {Object}
 */
module.exports = function (s3, bucket) {
    var extension = 'mp4';

    /**
     * Build the S3 key (path)
     *
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {string}
     */
    function buildKey(playlistId, videoId) {
        return playlistId + '/' + videoId + '.' + extension;
    }

    /**
     * Save the stream identified by the specified playlistId and videoId
     *
     * @param {Stream} stream
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {Promise}
     */
    function save(stream, playlistId, videoId) {
        // TODO Get list of stored files
        // Only if not stored already, save

        var params = {
            Bucket: bucket,
            Key: buildKey(playlistId, videoId),
            Body: stream
        };

        return new Promise(function (resolve, reject) {
            s3.upload(params, function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    return {
        save: save
    };
};
