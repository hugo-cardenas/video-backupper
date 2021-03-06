var VError = require('verror');
// var fs = require('fs');
var util = require('util');
var baserequire = require('base-require');
var validateVideoItem = baserequire('src/storage/videoItemValidator');
var createVideo = baserequire('src/video/video');

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
     * @returns {Promise<Object[]>} Resolves with array of stored video items
     */
    function getAllVideoItems() {
        return getFolderEntries()
            .then(getVideoItemsFromEntries)
            .catch(function (err) {
                throw createGetAllVideoItemsError(err);
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
                return Promise.reject(createSaveError(videoItem, err));
            });
    }

    /**
     * @returns {Promise<Object[]>}
     */
    function getFolderEntries() {
        return filesListFolder()
            .then(getEntriesFromResponse);
    }

    /**
     * returns {Promise}
     */
    function filesListFolder() {
        var arg = {
            path: '',
            recursive: true
        };
        return dropbox.filesListFolder(arg);
    }

    /**
     * @param {Object} response
     * @returns {Promise<Object[]>}
     */
    function getEntriesFromResponse(response) {
        var entries = response.entries;

        if (!response.hasMore) {
            return Promise.resolve(entries);
        }

        return filesListFolderContinue(response.cursor)
            .then(getEntriesFromResponse)
            .then(function (additionalEntries) {
                return entries.concat(additionalEntries);
            });
    }

    /**
     * @param {string} cursor
     * @returns {Promise}
     */
    function filesListFolderContinue(cursor) {
        var arg = { cursor: cursor };
        return dropbox.filesListFolderContinue(arg);
    }

    /**
     * @param {Object[]} entries
     * @returns {Object[]}
     */
    function getVideoItemsFromEntries(entries) {
        var playlistNames = getPlaylistNamesFromEntries(entries);
        return getVideoItemsFromEntriesAndPlaylistNames(entries, playlistNames);
    }

    /**
     * @param {Object[]} entries
     * @returns {string[]}
     */
    function getPlaylistNamesFromEntries(entries) {
        return filterEntries(entries, 'folder')
            .map(function (entry) {
                return entry.name;
            });
    };

    /**
     * @param {Object[]} entries
     * @param {string[]} playlistNames
     * @returns {Object[]}
     */
    function getVideoItemsFromEntriesAndPlaylistNames(entries, playlistNames) {
        return filterEntries(entries, 'file')
            .map(function (entry) {
                return getVideoItemFromResponseEntry(entry, playlistNames);
            });
    }

    /**
     * @param {Object[]} entries
     * @param {string} type
     * @returns {Object[]}
     */
    function filterEntries(entries, type) {
        return entries.filter(function (entry) {
            validateNonFalsyProperties(entry, ['.tag']);
            return entry['.tag'] === type;
        });
    }

    /**
     * @param {Object} entry
     * @returns {Object}
     */
    function getVideoItemFromResponseEntry(entry, playlistNames) {
        validateNonFalsyProperties(entry, ['name', 'path_display']);

        // This should already be lower case always
        var pathPlaylistName = getPlaylistNameFromPath(entry.path_display);
        var playlistName = playlistNames.find(function (playlistName) {
            return playlistName.toLowerCase() === pathPlaylistName.toLowerCase();
        });
        if (!playlistName) {
            throw new VError(
                'Playlist name not found for entry %s and playlist names %s',
                JSON.stringify(entry),
                JSON.stringify(playlistNames)
            );
        }

        return buildVideoItem(entry.name, playlistName);
    }

    /**
     * @param {string} name
     * @returns {string}
     */
    function buildVideoItem(entryName, playlistName) {
        // Example: videoBar (42).foo
        const regex = /^([^/]+)\s\(([^\s]+)\)\.[0-9a-zA-Z]+$/;
        const result = regex.exec(entryName);

        if (result && result[1] && result[2]) {
            const name = result[1];
            const id = result[2];
            return createVideo(id, name, playlistName);
        }

        throw new VError('Invalid entry name "%s"', entryName);
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    function getPlaylistNameFromPath(path) {
        // Example: /playlistFoo/videoBar.foo
        var parts = path.split('/');
        if (parts[1] && parts[2]) {
            return parts[1];
        }
        throw new VError('Invalid path "%s"', JSON.stringify(path));
    }

    /**
     * @param {Object} object
     * @param {string[]} properties
     */
    function validateNonFalsyProperties(object, properties) {
        var missingProperties = properties.filter(function (property) {
            return !object[property];
        });
        if (missingProperties.length > 0) {
            throw new VError('Missing or empty properties %s in object %s', JSON.stringify(missingProperties), JSON.stringify(object));
        }
    }

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
            info: { responseError: util.inspect(error) }
        };
        if (error.error) {
            return new VError(options, error.error);
        }
        return new VError(options, 'Unable to parse response');
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
                return Promise.resolve(`${dirPath}/${videoItem.name} (${videoItem.id}).${extension}`);
            });
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
     * @param {Error} err
     * @returns {Error}
     */
    function createGetAllVideoItemsError(err) {
        return new VError(err, 'Dropbox storage unable to get all video items');
    }

    /**
     * @param {Object} videoItem
     * @param {Error} err
     * @returns {Error}
     */
    function createSaveError(videoItem, err) {
        return new VError(err, 'Dropbox storage unable to save stream for videoItem %s', JSON.stringify(videoItem));
    }

    return {
        getAllVideoItems: getAllVideoItems,
        save: save
    };
};
