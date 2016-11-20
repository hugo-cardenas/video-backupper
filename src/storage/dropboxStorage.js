var VError = require('verror');
var baserequire = require('base-require');
var validateVideoItem = baserequire('src/storage/videoItemValidator');

/**
 * @typedef {Object} Storage
 *
 * @property {function} save Save a stream in Dropbox
 */

/**
 * Create an Dropbox storage
 *
 * @param {Object} dropbox Dropbox client object
 * @returns {Object}
 */
module.exports = function (dropbox) {
    var extension = 'mp4';

    /**
     * @param {Readable} stream
     * @returns {Promise<Buffer, Error>} Resolves with a buffer containing the stream contents
     */
    function getStreamBuffer(stream) {
        return new Promise(function (resolve, reject) {
            var chunks = [];
            stream.on('data', function (chunk) {
                chunks.push(chunk);
            });
            stream.on('error', function (err) {
                return reject(err);
            });
            stream.on('end', function () {
                return resolve(Buffer.concat(chunks));
            });
        });
    }

    /**
     * @param {string} playlistName
     * @returns {Promise<string>}
     */
    function getDirPath(playlistName) {
        var path = '/' + playlistName;
        var arg = {
            path: path
        };
        return dropbox.filesCreateFolder(arg)
            .then(function () {
                return Promise.resolve(path);
            })
            .catch(function (err) {
                var error = parseResponseError(err);
                if (isFolderConflictError(error)) {
                    return Promise.resolve(path);
                }
                return Promise.reject(error);
            });
    }

    /**
     * @param {Object} err Error object in response
     * @returns {Object|Error}
     */
    function parseResponseError(error) {
        var options = {
            info: { responseError: JSON.stringify(error) }
        };
        if (error.error) {
            return new VError(options, error.error);
        }
        return new VError(options, 'Unable to parse response error');
    }

    /**
     * @param {Error} err
     * @returns {boolean}
     */
    function isFolderConflictError(err) {
        try {
            return JSON.parse(err.message).error.path['.tag'] === 'conflict';
        } catch (error) {
            return false;
        }
    }

    /**
     * @param {Object} videoItem
     * @returns {Promise<string>}
     */
    function getDropboxPath(videoItem) {
        return getDirPath(videoItem.playlistName)
            .then(function (dirPath) {
                return Promise.resolve(dirPath + '/' + videoItem.videoName + '.' + extension);
            });
    }
    /**
     * @param {Object} videoItem
     * @param {Error} err
     * @returns {Error}
     */
    function createError(videoItem, err) {
        return new VError(err, 'Dropbox storage unable to save stream for videoItem %s', JSON.stringify(videoItem));
    }

    /**
     * Save file contents to dropbox path
     * @param {string} dropboxPath
     * @param {Readable} stream
     * @returns {Promise}
     */
    function saveStream(dropboxPath, stream) {
        return getStreamBuffer(stream)
            .then(function (buffer) {
                var arg = {
                    contents: buffer,
                    mode: { '.tag': 'overwrite' },
                    path: dropboxPath
                };
                return dropbox.filesUpload(arg);
            })
            .catch(function (err) {
                return Promise.reject(parseResponseError(err));
            });
    }

    /**
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
                return getDropboxPath(videoItem);
            })
            .then(function (dropboxPath) {
                return saveStream(dropboxPath, stream);
            })
            .catch(function (err) {
                return Promise.reject(createError(videoItem, err));
            });
    }

    return {
        save: save
    };
};
