var Dropbox = require('dropbox');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');

var dropbox;

/**
 * @param {string} key
 * @returns {Object|string|number}
 */
function getConfigValue(key) {
    return configLocator
        .getConfigManager()
        .getConfig()
        .get(key);
}

/**
 * @returns {Object} Dropbox client
 */
function getDropbox() {
    if (!dropbox) {
        dropbox = new Dropbox({
            accessToken: getConfigValue('storage.dropbox.token')
        });
    }
    return dropbox;
}

/**
 * @param {Object} dropbox Dropbox client
 * @param {string} path
 * @returns {Promise<string[]>} Resolves with list of files/folders in path
 */
function listFiles(path) {
    return getDropbox().filesListFolder({ path: path })
        .then(function (response) {
            var files = response.entries.map(function (entry) {
                return entry.path_lower;
            });
            return Promise.resolve(files);
        });
}

/**
 * @param {Object} dropbox Dropbox client
 * @param {string} file
 * @returns {Promise}
 */
function deleteFile(file) {
    var arg = { path: file };
    return getDropbox().filesDelete(arg);
}

/**
 * Delete all files and folders from root dir
 */
function deleteAllFiles() {
    return listFiles('')
        // Clean test dropbox dir
        .then(function (files) {
            var deleteFilePromises = files.map(function (file) {
                return deleteFile(file);
            });
            return Promise.all(deleteFilePromises);
        })
        // Verify that dir is empty after cleaning
        .then(function () {
            return listFiles('');
        })
        .then(function (files) {
            if (files.length > 0) {
                var error = new Error('Failed to delete all files, remaining: ' + files.join(', '));
                return Promise.reject(error);
            }
        });
}

module.exports = {
    deleteAllFiles: deleteAllFiles,
    deleteFile: deleteFile,
    listFiles: listFiles
};
