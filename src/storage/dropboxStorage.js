/**
 * @typedef {Object} Storage
 *
 * @property {function} save Save a stream in Dropbox
 */

var tmp = require('tmp');
var fs = require('fs');

/**
 * Create an Dropbox storage
 *
 * @param {Object} dropbox Dropbox client object
 * @returns {Object}
 */
module.exports = function (dropbox) {
    var extension = 'mp4';

    /**
     * Create a tmp file with the contents of stream
     *
     * @param {Stream} stream
     * @returns {string} Path of the tmp file
     */
    function createTmpFile(stream) {
        return createFile()
            .then(function (file) {
                return writeStreamToFile(stream, file);
            });
    }

    /**
     * @param {Stream} stream
     * @param {string} file
     * @returns {Promise}
     */
    function writeStreamToFile(stream, file) {
        return new Promise(function (resolve, reject) {
            var writableStream = fs.createWriteStream(file);
            stream.pipe(writableStream);
            stream.on('end', function () {
                return resolve(file);
            });
        });
    }

    /**
     * Create temporary file
     * @returns {Promise<string, Stream>}
     */
    function createFile() {
        return new Promise(function (resolve, reject) {
            tmp.file(function (err, path) {
                if (err) {
                    return reject(err);
                }
                return resolve(path);
            });
        });
    }

    /**
     * @param {string} file
     * @returns {Promise}
     */
    function deleteTmpFile(file) {
        return new Promise(function (resolve, reject) {
            fs.unlink(file, function () {
                return resolve();
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
        console.log(err);
        var message = 'Unable to save stream for playlistId: ' + playlistId +
            ', videoId: ' + videoId +
            ', reason: ' + err.error;
        return new Error(message);
    }

    /**
     * Save file contents to dropbox path
     * @param {string} dropboxPath
     * @param {string} file
     * @returns {Promise}
     */
    function saveFile(dropboxPath, file) {
        var arg = {
            contents: fs.readFileSync(file),
            path: dropboxPath
        };
        return dropbox.filesUpload(arg);
    }

    /**
     * @param {Stream} stream
     * @param {string} playlistId
     * @param {string} videoId
     * @returns {Promise}
     */
    function save(stream, playlistId, videoId) {
        var promises = [
            getDropboxPath(playlistId, videoId),
            createTmpFile(stream)
        ];
        var tmpFile;
        return Promise.all(promises)
            .then(function (values) {
                var dropboxPath = values[0];
                tmpFile = values[1];
                return saveFile(dropboxPath, tmpFile);
            })
            .then(function () {
                return deleteTmpFile(tmpFile);
            })
            .catch(function (err) {
                return deleteTmpFile(tmpFile)
                    .then(function () {
                        return Promise.reject(createError(playlistId, videoId, err));
                    });
            });
    }

    return {
        save: save
    };
};
