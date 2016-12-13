var test = require('blue-tape');
var sinon = require('sinon');
var _ = require('lodash');
var VError = require('verror');
var Readable = require('stream').Readable;
var baserequire = require('base-require');
var createDropboxStorage = baserequire('src/storage/dropboxStorage');

test('dropboxStorage - save - succeeds', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;
    var expectedFilePath = expectedFolderPath + '/' + videoName + '.mp4';

    var dropbox = {
        filesCreateFolder: function () {},
        filesUpload: function () {}
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.resolve());

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: { '.tag': 'overwrite' },
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem);
});

test('dropboxStorage - save - folder exists', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;
    var expectedFilePath = expectedFolderPath + '/' + videoName + '.mp4';

    var dropbox = {
        filesCreateFolder: function () {},
        filesUpload: function () {}
    };

    // This is the error returned by Dropbox if folder conflict
    var promiseError = {
        error: JSON.stringify({
            error: { path: { '.tag': 'conflict' } }
        })
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(promiseError));

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: { '.tag': 'overwrite' },
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem);
});

var invalidVideoItems = [
    {},
    { videoName: 'foo' },
    { playlistName: 'foo' }
];
invalidVideoItems.forEach(function (videoItem, index) {
    test('dropboxStorage - save - invalid videoItem #' + index, function (t) {
        var contents = 'foobar';
        var stream = createReadableStream(contents);

        var dropbox = {};

        var storage = createDropboxStorage(dropbox);
        return storage.save(stream, videoItem)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(JSON.stringify(videoItem)));
            });
    });
});

test('dropboxStorage - save - folder creation fails with non solvable error', function (t) {
    var stream = {};
    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;

    var dropbox = {
        filesCreateFolder: function () {}
    };

    var errorMessage = 'Folder creation has failed';
    var promiseError = {
        error: errorMessage
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(JSON.stringify(videoItem)));
            t.ok(err.message.includes(errorMessage));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - folder creation fails with non parsable error', function (t) {
    var stream = {};
    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;

    var dropbox = {
        filesCreateFolder: function () {}
    };

    var promiseError = { foo: 'Non parsable error' };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(JSON.stringify(videoItem)));
            t.ok(err.message.includes('Unable to parse response error'));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - upload fails', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;
    var expectedFilePath = expectedFolderPath + '/' + videoName + '.mp4';

    var dropbox = {
        filesCreateFolder: function () {},
        filesUpload: function () {}
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.resolve());

    var errorMessage = 'Upload has failed';
    var promiseError = {
        error: errorMessage
    };

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: { '.tag': 'overwrite' },
            path: expectedFilePath
        })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(JSON.stringify(videoItem)));
            t.ok(err.message.includes(errorMessage));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - upload fails with non parsable error', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistName = 'playlist42';
    var videoName = 'video44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };

    var expectedFolderPath = '/' + playlistName;
    var expectedFilePath = expectedFolderPath + '/' + videoName + '.mp4';

    var dropbox = {
        filesCreateFolder: function () {},
        filesUpload: function () {}
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.resolve());

    var promiseError = { foo: 'Non parsable error' };

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: { '.tag': 'overwrite' },
            path: expectedFilePath
        })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, videoItem)
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(JSON.stringify(videoItem)));
            t.ok(err.message.includes('Unable to parse response error'));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test.only('dropboxStorage - getAllVideoItems - succeeds', function (t) {
    var playlistName1 = 'Playlist 1';
    var playlistName2 = 'Playlist 2';
    var videoName1 = 'Video 1';
    var videoName2 = 'Video 2';
    var videoName3 = 'Video 3';

    var videoItems = [
        createVideoItem(playlistName1, videoName1),
        createVideoItem(playlistName1, videoName2),
        createVideoItem(playlistName2, videoName3)
    ];

    var dropbox = {
        filesListFolder: function () {}
    };

    var expectedArg = {
        path: '',
        recursive: true
    };

    var dropboxResponse = createDropboxListFolderResponse(videoItems);

    sinon.mock(dropbox).expects('filesListFolder')
        .withArgs(expectedArg)
        .returns(Promise.resolve(dropboxResponse));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function (storedVideoItems) {
            assertVideoItems(t, storedVideoItems, videoItems);
        });
});

test('dropboxStorage - getAllVideoItems - succeeds with multiple pages', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder fails', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder fails with non parsable error', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder fails after the first successful page', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder contains invalid name', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder contains invalid path', function (t) {});

test('dropboxStorage - getAllVideoItems - list folder is missing folder entry', function (t) {});

/**
 * Create a readable stream with the specified contents
 * @param {string} contents
 * @returns {Readable}
 */
function createReadableStream(contents) {
    var stream = new Readable();
    stream.push(contents);
    stream.push(null);
    return stream;
}

/**
 * @param {string} playlistName
 * @param {string} videoName
 * @returns {Object} Video item
 */
function createVideoItem(playlistName, videoName) {
    return {
        playlistName: playlistName,
        videoName: videoName
    };
}

/**
 * @param {Object[]} videoItems
 * @param {string} cursor Optional parameter
 * @returns
 */
function createDropboxListFolderResponse(videoItems, cursor) {
    var response = {
        entries: createListFolderResponseEntries(videoItems),
        hasMore: false
    };
    if (cursor) {
        response.cursor = cursor;
        response.hasMore = true;
    }
    return response;
}

/**
 * @param {Object[]} videoItems
 * @returns {Object[]}
 */
function createListFolderResponseEntries(videoItems) {
    var playlistNames = _.uniq(
        videoItems.map(function (videoItem) {
            return videoItem.playlistName;
        })
    );

    var fileEntries = videoItems.map(function (videoItem) {
        return createResponseFileEntry(videoItem);
    });
    var folderEntries = playlistNames.map(function (playlistName) {
        return createResponseFolderEntry(playlistName);
    });

    return _.shuffle(fileEntries.concat(folderEntries));
}

/**
 * @param {Object} videoItem
 * @returns {Object}
 */
function createResponseFileEntry(videoItem) {
    var name = videoItem.videoName + '.foo';
    var pathDisplay = '/' + videoItem.playlistName.toLowerCase() + '/' + name;
    var pathLower = pathDisplay.toLowerCase();
    return {
        '.tag': 'file',
        name: name,
        path_display: pathDisplay,
        path_lower: pathLower
    };
}

/**
 * @param {string} playlistName
 * @returns {Object}
 */
function createResponseFolderEntry(playlistName) {
    return {
        '.tag': 'folder',
        name: playlistName
    };
}

/**
 * @param {Object} t Tape test object
 * @param {Object[]} videoItems
 * @param {Object[]} expectedVideoItems
 */
function assertVideoItems(t, videoItems, expectedVideoItems) {
    t.equal(expectedVideoItems.length, videoItems.length);
    // TODO Assert video items contained in any order
    expectedVideoItems.forEach(function (expectedVideoItem) {
        t.ok(videoItems.includes(expectedVideoItem));
    });
}
