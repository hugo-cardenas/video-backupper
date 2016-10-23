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
     * @param {string} playlistId
     * @returns {Promise<string>}
     */
    function getDirPath(playlistId) {
        var path = '/' + playlistId;
        var arg = {
            path: path
        };
        return dropbox.filesCreateFolder(arg)
            .then(function () {
                return Promise.resolve(path);
            })
            .catch(function (err) {
                var responseError = parseResponseError(err);
                if (isFolderConflictError(responseError)) {
                    return Promise.resolve(path);
                }
                return Promise.reject(responseError);
            });
    }

    /**
     * @param {Object} err Error object in response
     * @returns {Object|Error}
     */
    function parseResponseError(err) {
        try {
            return JSON.parse(err.error);
        } catch (jsonError) {
            return new Error('Unable to parse response error');
        }
    }

    /**
     * @param {Object} err Dropbox base Error
     * @returns {boolean}
     */
    function isFolderConflictError(err) {
        try {
            return err.error.path['.tag'] === 'conflict';
        } catch (error) {
            return false;
        }
    }

    /**
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {Promise<string>}
     */
    function getDropboxPath(playlistId, videoId) {
        return getDirPath(playlistId)
            .then(function (dirPath) {
                return Promise.resolve(dirPath + '/' + videoId + '.' + extension);
            });
    }
    /**
     * @param {string} playlistId
     * @param {string} videoId
     *
     * @param {Error} err
     * @returns {Error}
     */
    function createError(playlistId, videoId, err) {
        var message = 'Unable to save stream for playlistId: ' + playlistId +
            ', videoId: ' + videoId +
            ', reason: ' + err.error;
        return new Error(message);
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
                    path: dropboxPath
                };
                return dropbox.filesUpload(arg);
            });
    }

    /**
     * TODO Set file write mode overwrite - if file exists, overwrite it
     */

    /**
     * @param {Stream} stream
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {Promise}
     */
    function save(stream, playlistId, videoId) {
        return getDropboxPath(playlistId, videoId)
            .then(function (dropboxPath) {
                return saveStream(dropboxPath, stream);
            })
            .catch(function (err) {
                return Promise.reject(createError(playlistId, videoId, err));
            });
    }

    return {
        save: save
    };
};
