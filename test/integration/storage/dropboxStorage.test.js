var test = require('blue-tape');
var fs = require('fs');
var _ = require('lodash');
var request = require('request');
var tmp = require('tmp-promise');
var Dropbox = require('dropbox');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');

var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

var tmpFileCleanupCallbacks = [];

test('dropboxStorage - save - succeeds', options, function (t) {
    var storage = storageLocator.getStorageManager().getStorage('dropbox');
    var extension = 'mp4';

    var file1 = './test/integration/storage/video1.mp4';
    var file2 = './test/integration/storage/video2.mp4';
    var file3 = './test/integration/storage/video3.mp4';

    var stream1 = fs.createReadStream(file1);
    var stream2 = fs.createReadStream(file2);
    var stream3 = fs.createReadStream(file3);

    var playlistName1 = 'playlist 1';
    var playlistName2 = 'playlist 2';

    var id1 = 'videoId1';
    var name1 = 'video name 1';

    var id2 = 'videoId2';
    var name2 = 'video name 2';

    var id3 = 'videoId3';
    var name3 = '(video (Name) ()3))'; // Parentheses in name should not affect extraction of id

    var videoItem1 = createVideoItem(id1, name1, playlistName1);
    var videoItem2 = createVideoItem(id2, name2, playlistName1);
    var videoItem3 = createVideoItem(id3, name3, playlistName2);

    var folder1 = '/' + playlistName1.toLowerCase();
    var folder2 = '/' + playlistName2.toLowerCase();

    var dropboxFilePath1 = `${folder1}/${name1.toLowerCase()} (${id1.toLowerCase()}).${extension}`;
    var dropboxFilePath2 = `${folder1}/${name2.toLowerCase()} (${id2.toLowerCase()}).${extension}`;
    var dropboxFilePath3 = `${folder2}/${name3.toLowerCase()} (${id3.toLowerCase()}).${extension}`;

    var dropbox = getDropbox();

    return cleanDropboxFiles(t)
        // Save 3 elements
        .then(function () {
            return Promise.all([
                storage.save(stream1, videoItem1),
                storage.save(stream2, videoItem2),
                storage.save(stream3, videoItem3)
            ]);
        })
        // Assert they are succesfully stored
        .then(function () {
            return Promise.all([
                assertFiles(t, dropbox, '', [folder1, folder2]),
                assertFiles(t, dropbox, folder1, [dropboxFilePath1, dropboxFilePath2]),
                assertFiles(t, dropbox, folder2, [dropboxFilePath3])
            ]);
        })
        // Assert the file contents
        .then(function () {
            return Promise.all([
                assertFileContents(t, dropbox, dropboxFilePath1, file1),
                assertFileContents(t, dropbox, dropboxFilePath2, file2),
                assertFileContents(t, dropbox, dropboxFilePath3, file3)
            ]);
        })
        .then(function () {
            cleanTmpFiles();
            return Promise.resolve();
        });
});

test('dropboxStorage - save - overwrite file', options, function (t) {
    var storage = storageLocator.getStorageManager().getStorage('dropbox');
    var extension = 'mp4';

    var file1 = './test/integration/storage/video1.mp4';
    var file2 = './test/integration/storage/video2.mp4';
    var stream1 = fs.createReadStream(file1);
    var stream2 = fs.createReadStream(file2);

    var playlistName1 = 'playlist 1';
    var id = 'videoId1';
    var name = 'video 1';
    var videoItem1 = createVideoItem(id, name, playlistName1);

    var dropboxFilePath1 = `/${playlistName1.toLowerCase()}/${name.toLowerCase()} (${id.toLowerCase()}).${extension}`;

    var dropbox = getDropbox();

    return cleanDropboxFiles(t)
        // Save video1
        .then(function () {
            return storage.save(stream1, videoItem1);
        })
        // Save a different stream on the same video id
        .then(function () {
            return storage.save(stream2, videoItem1);
        })
        // Assert the file contents
        .then(function () {
            return assertFileContents(t, dropbox, dropboxFilePath1, file2);
        })
        .then(function () {
            cleanTmpFiles();
            return Promise.resolve();
        });
});

test('dropboxStorage - save and getAllVideoItems - succeeds', options, function (t) {
    var storage = storageLocator.getStorageManager().getStorage('dropbox');

    var file1 = './test/integration/storage/video1.mp4';
    var file2 = './test/integration/storage/video2.mp4';
    var file3 = './test/integration/storage/video3.mp4';

    var stream1 = fs.createReadStream(file1);
    var stream2 = fs.createReadStream(file2);
    var stream3 = fs.createReadStream(file3);

    var playlistName1 = 'PlayList 1';
    var playlistName2 = 'PlayList 2';

    var id1 = 'videoId1';
    var name1 = 'Video name 1';

    var id2 = 'videoId2';
    var name2 = 'Video name 2';

    var id3 = 'videoId3';
    var name3 = '(video (Name) ()3))'; // Parentheses in name should not affect extraction of id

    var videoItem1 = createVideoItem(id1, name1, playlistName1);
    var videoItem2 = createVideoItem(id2, name2, playlistName1);
    var videoItem3 = createVideoItem(id3, name3, playlistName2);

    var expectedVideoItems = [videoItem1, videoItem2, videoItem3];

    return cleanDropboxFiles(t)
        // Save 3 elements
        .then(function () {
            return Promise.all([
                storage.save(stream1, videoItem1),
                storage.save(stream2, videoItem2),
                storage.save(stream3, videoItem3)
            ]);
        })
        // Assert getAllVideoItems returns all stored video items
        .then(function () {
            return storage.getAllVideoItems();
        })
        .then(function (storedVideoItems) {
            t.equal(expectedVideoItems.length, storedVideoItems.length);
            expectedVideoItems.forEach(function (expectedVideoItem) {
                var foundItem = storedVideoItems.find(function (storedItem) {
                    return _.isEqual(expectedVideoItem, storedItem);
                });
                t.ok(foundItem, 'Item ' + JSON.stringify(expectedVideoItem) + ' is found in stored items');
            });
        });
});

/**
 * @param {string} id
 * @param {string} name
 * @param {playlistName} playlistName
 * @returns {Object}
 */
function createVideoItem(id, name, playlistName) {
    return { id, name, playlistName };
}

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
                t.ok(files.includes(expectedFile), `${JSON.stringify(files)} should contain ${expectedFile}`);
            });
            return Promise.resolve();
        });
}

/**
 * Assert contents of a dropbox file
 *
 * @param {Object} t Test object
 * @param {Object} dropbox Dropbox client
 * @param {string} dropboxPath Path of the file in dropbox
 * @param {string} expectedFilePath Path of the file with expected contents
 */
function assertFileContents(t, dropbox, dropboxPath, expectedFile) {
    return getDropboxTempLink(dropbox, dropboxPath)
        .then(saveUrlToTmpFile)
        .then(function (tmpFile) {
            return Promise.all([
                getStreamBuffer(fs.createReadStream(tmpFile)),
                getStreamBuffer(fs.createReadStream(expectedFile))
            ]);
        })
        .then(function (values) {
            var dropboxBuffer = values[0];
            var expectedBuffer = values[1];
            t.ok(dropboxBuffer.toString('binary') === expectedBuffer.toString('binary'), 'Buffers are equal');
        });
}

/**
 * @param {Dropbox} dropbox
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function getDropboxTempLink(dropbox, filePath) {
    return dropbox.filesGetTemporaryLink({ path: filePath })
        .then(function (response) {
            return response.link;
        });
}

/**
 * Create a new tmp file and save url contents into it
 * @param {string} url
 * @returns {Promise<string>} Resolves with filePath
 */
function saveUrlToTmpFile(url) {
    return createTmpFile()
        .then(function (filePath) {
            return saveUrlToFile(url, filePath);
        });
}

/**
 * Save url contents to file
 * @param {string} url
 * @param {string} filePath
 * @returns {Promise<string>} Resolves with filePath
 */
function saveUrlToFile(url, filePath) {
    return new Promise(function (resolve, reject) {
        var readableStream = request(url);
        readableStream
            .on('error', function (err) {
                return reject(err);
            })
            .pipe(fs.createWriteStream(filePath));
        readableStream.on('end', function () {
            return resolve(filePath);
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

/**
 * @param {Object} t Tape test object
 * @returns {Promise}
 */
function cleanDropboxFiles(t) {
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
        });
}

/**
 * Create a tmp file which will be deleted on process exit
 * @returns {Promise<string>} Resolves with file path
 */
function createTmpFile() {
    return tmp.file()
        .then(result => {
            tmpFileCleanupCallbacks.push(result.cleanup);
            return result.path;
        });
}

function cleanTmpFiles() {
    tmpFileCleanupCallbacks.forEach(function (callback) {
        callback();
    });
}

/**
 * Get buffer from stream
 * @param {Stream} stream
 * @returns {Promise<Buffer>}
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
