var test = require('blue-tape');
var intoStream = require('into-stream');
var request = require('request');
var Dropbox = require('dropbox');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');

test.skip('dropboxStorage - save - succeeds', function (t) {
    var storage = storageLocator.getStorageManager().getStorage('dropbox');
    var extension = 'mp4';

    var contents1 = 'foo';
    var contents2 = 'bar';
    var contents3 = 'baz';

    var stream1 = intoStream(contents1);
    var stream2 = intoStream(contents2);
    var stream3 = intoStream(contents3);

    var playlistId1 = 'playlistId1';
    var playlistId2 = 'playlistId2';
    var videoId1 = 'videoId1';
    var videoId2 = 'videoId2';
    var videoId3 = 'videoId3';

    var folder1 = '/' + playlistId1.toLowerCase();
    var folder2 = '/' + playlistId2.toLowerCase();

    var expectedFile1 = folder1 + '/' + videoId1.toLowerCase() + '.' + extension;
    var expectedFile2 = folder1 + '/' + videoId2.toLowerCase() + '.' + extension;
    var expectedFile3 = folder2 + '/' + videoId3.toLowerCase() + '.' + extension;

    var dropbox = getDropbox();

    return listFiles(dropbox, '')
        // Clean test dropbox dir
        .then(function (files) {
            var deleteFilePromises = files.map(function (file) {
                return deleteFile(dropbox, file);
            });
            return Promise.all(deleteFilePromises);
        })
        // Verify that dir is empty after cleaning
        .then(function () {
            return assertFiles(t, dropbox, '', []);
        })
        // Save 3 elements
        .then(function () {
            return Promise.all([
                storage.save(stream1, playlistId1, videoId1),
                storage.save(stream2, playlistId1, videoId2),
                storage.save(stream3, playlistId2, videoId3)
            ]);
        })
        // Assert they are succesfully stored
        .then(function () {
            return Promise.all([
                assertFiles(t, dropbox, '', [folder1, folder2]),
                assertFiles(t, dropbox, folder1, [expectedFile1, expectedFile2]),
                assertFiles(t, dropbox, folder2, [expectedFile3])
            ]);
        })
        // Assert the file contents
        .then(function () {
            return Promise.all([
                assertFileContents(t, dropbox, expectedFile1, contents1),
                assertFileContents(t, dropbox, expectedFile2, contents2),
                assertFileContents(t, dropbox, expectedFile3, contents3)
            ]);
        })
        .catch(function (err) {
            t.fail(err);
        });
});

/**
 * Assert contents of a dropbox directory
 *
 * @param {Object} t Test object
 * @param {Object} dropbox Dropbox client
 * @param {string} path Directory path
 * @param {string[]} expectedFiles
 * @returns {Promise}
 */
function assertFiles(t, dropbox, path, expectedFiles) {
    return listFiles(dropbox, path)
        .then(function (files) {
            t.equal(files.length, expectedFiles.length);
            expectedFiles.forEach(function (expectedFile) {
                t.ok(files.includes(expectedFile));
            });
            return Promise.resolve();
        });
}

/**
 * Assert contents of a dropbox file
 *
 * @param {any} t Test object
 * @param {any} dropbox Dropbox client
 * @param {any} filePath Path of the file in dropbox
 * @param {any} expectedContents Expected contents
 */
function assertFileContents(t, dropbox, filePath, expectedContents) {
    return dropbox.filesGetTemporaryLink({ path: filePath })
        .then(function (response) {
            return getUrlContents(response.link);
        })
        .then(function (contents) {
            t.equal(contents, expectedContents);
            return Promise.resolve();
        });
}

/**
 * @param {string} url
 * @returns {Promise} Resolves with url contents
 */
function getUrlContents(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, response, body) {
            if (err) {
                return reject(err);
            }
            return resolve(body);
        });
    });
}

/**
 * @param {Object} dropbox Dropbox client
 * @param {string} path
 * @returns {Promise<string[]>} Resolves with list of files/folders in path
 */
function listFiles(dropbox, path) {
    return dropbox.filesListFolder({ path: path })
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
function deleteFile(dropbox, file) {
    var arg = { path: file };
    return dropbox.filesDelete(arg);
}

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

var dropbox;

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
