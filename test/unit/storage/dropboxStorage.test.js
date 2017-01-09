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
                assertSaveError(t, err, videoItem);
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
            assertSaveError(t, err, videoItem);
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
            assertSaveError(t, err, videoItem);
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
            assertSaveError(t, err, videoItem);
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
            assertSaveError(t, err, videoItem);
            t.ok(err.message.includes('Unable to parse response error'));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - getAllVideoItems - succeeds', function (t) {
    var playlistName1 = 'Playlist 1';
    var playlistName2 = 'Playlist 2';
    var videoName1 = 'Video 1';
    var videoName2 = 'Video 2';
    var videoName3 = 'Video 3.hello.bar';

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

test('dropboxStorage - getAllVideoItems - succeeds with multiple pages', function (t) {
    var playlistName1 = 'Playlist 1';
    var playlistName2 = 'Playlist 2';
    var playlistName3 = 'Playlist 3';
    var videoName1 = 'Video 1';
    var videoName2 = 'Video 2';
    var videoName3 = 'Video 3';
    var videoName4 = 'Video 4';
    var videoName5 = 'Video 5';
    var videoName6 = 'Video 6';

    var videoItems = [
        createVideoItem(playlistName1, videoName1),
        createVideoItem(playlistName1, videoName2),
        createVideoItem(playlistName2, videoName3),
        createVideoItem(playlistName2, videoName4),
        createVideoItem(playlistName3, videoName5),
        createVideoItem(playlistName3, videoName6)
    ];

    var cursor1 = 'cursor1';
    var cursor2 = 'cursor2';

    var expectedArg1 = {
        path: '',
        recursive: true
    };
    var expectedArg2 = { cursor: cursor1 };
    var expectedArg3 = { cursor: cursor2 };

    var dropboxResponse1 = createDropboxListFolderResponse(videoItems.slice(0, 2), cursor1);
    var dropboxResponse2 = createDropboxListFolderResponse(videoItems.slice(2, 4), cursor2);
    var dropboxResponse3 = createDropboxListFolderResponse(videoItems.slice(4, 6));

    var dropbox = {
        filesListFolder: sinon.stub(),
        filesListFolderContinue: sinon.stub()
    };
    dropbox.filesListFolder
        .withArgs(expectedArg1)
        .returns(Promise.resolve(dropboxResponse1));
    dropbox.filesListFolderContinue
        .withArgs(expectedArg2)
        .returns(Promise.resolve(dropboxResponse2));
    dropbox.filesListFolderContinue
        .withArgs(expectedArg3)
        .returns(Promise.resolve(dropboxResponse3));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function (storedVideoItems) {
            assertVideoItems(t, storedVideoItems, videoItems);
        });
});

test('dropboxStorage - getAllVideoItems - list folder fails', function (t) {
    var dropbox = {
        filesListFolder: sinon.stub()
    };

    var expectedArg = {
        path: '',
        recursive: true
    };

    var errorMessage = 'FilesListFolder failed';
    dropbox.filesListFolder
        .withArgs(expectedArg)
        .returns(Promise.reject(new Error(errorMessage)));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            assertGetAllVideoItemsError(t, err);
            t.ok(err.message.includes(errorMessage));
        });
});

test('dropboxStorage - getAllVideoItems - list folder fails after the first successful page', function (t) {
    var playlistName1 = 'Playlist 1';
    var playlistName2 = 'Playlist 2';
    var playlistName3 = 'Playlist 3';
    var videoName1 = 'Video 1';
    var videoName2 = 'Video 2';
    var videoName3 = 'Video 3';
    var videoName4 = 'Video 4';
    var videoName5 = 'Video 5';
    var videoName6 = 'Video 6';

    var videoItems = [
        createVideoItem(playlistName1, videoName1),
        createVideoItem(playlistName1, videoName2),
        createVideoItem(playlistName2, videoName3),
        createVideoItem(playlistName2, videoName4),
        createVideoItem(playlistName3, videoName5),
        createVideoItem(playlistName3, videoName6)
    ];

    var cursor1 = 'cursor1';

    var expectedArg1 = {
        path: '',
        recursive: true
    };
    var expectedArg2 = { cursor: cursor1 };

    var dropboxResponse1 = createDropboxListFolderResponse(videoItems.slice(0, 2), cursor1);

    var errorMessage = 'FilesListFolderContinue failed';
    var dropbox = {
        filesListFolder: sinon.stub(),
        filesListFolderContinue: sinon.stub()
    };
    dropbox.filesListFolder
        .withArgs(expectedArg1)
        .returns(Promise.resolve(dropboxResponse1));
    dropbox.filesListFolderContinue
        .withArgs(expectedArg2)
        .returns(Promise.reject(new Error(errorMessage)));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            assertGetAllVideoItemsError(t, err);
            t.ok(err.message.includes(errorMessage));
        });
});

test('dropboxStorage - getAllVideoItems - list folder contains invalid path', function (t) {
    var playlistName1 = 'Playlist 1';
    var videoName1 = 'Video 1';

    var dropbox = {
        filesListFolder: sinon.stub()
    };

    var expectedArg = {
        path: '',
        recursive: true
    };

    var path = '/foo';
    var entries = [
        createResponseFileEntry(videoName1 + '.foo', path),
        createResponseFolderEntry(playlistName1)
    ];
    var dropboxResponse = createDropboxListFolderResponseWithEntries(entries);

    dropbox.filesListFolder
        .withArgs(expectedArg)
        .returns(Promise.resolve(dropboxResponse));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            assertGetAllVideoItemsError(t, err);
            t.ok(err.message.includes('Invalid path'));
            t.ok(err.message.includes(path));
        });
});

test('dropboxStorage - getAllVideoItems - list folder contains invalid name', function (t) {
    var playlistName1 = 'Playlist 1';
    var videoName1 = 'Video 1';

    var dropbox = {
        filesListFolder: sinon.stub()
    };

    var expectedArg = {
        path: '',
        recursive: true
    };

    var entries = [
        createResponseFileEntry(
            videoName1, // File name is missing extension
            ('/' + playlistName1 + '/' + videoName1).toLowerCase()
        ),
        createResponseFolderEntry(playlistName1)
    ];
    var dropboxResponse = createDropboxListFolderResponseWithEntries(entries);

    dropbox.filesListFolder
        .withArgs(expectedArg)
        .returns(Promise.resolve(dropboxResponse));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            assertGetAllVideoItemsError(t, err);
            t.ok(err.message.includes('Invalid video name'));
            t.ok(err.message.includes(videoName1));
        });
});

test('dropboxStorage - getAllVideoItems - list folder is missing folder entry', function (t) {
    var playlistName2 = 'Playlist 2';
    var videoName1 = 'Video 1';

    var dropbox = {
        filesListFolder: sinon.stub()
    };

    var expectedArg = {
        path: '',
        recursive: true
    };

    var fileEntry = createResponseFileEntry(
        videoName1 + '.foo',
        '/playlist 1/bar'
    );
    var entries = [
        fileEntry,
        // Missing corresponding folder entry for the file entry
        createResponseFolderEntry(playlistName2)
    ];
    var dropboxResponse = createDropboxListFolderResponseWithEntries(entries);

    dropbox.filesListFolder
        .withArgs(expectedArg)
        .returns(Promise.resolve(dropboxResponse));

    var storage = createDropboxStorage(dropbox);
    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            assertGetAllVideoItemsError(t, err);
            t.ok(err.message.includes('Playlist name not found for entry'));
            t.ok(err.message.includes(JSON.stringify(fileEntry)));
            t.ok(err.message.includes(JSON.stringify([playlistName2])));
        });
});

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
 * @returns {Object}
 */
function createDropboxListFolderResponse(videoItems, cursor) {
    return createDropboxListFolderResponseWithEntries(
        createListFolderResponseEntries(videoItems), cursor
    );
}

/**
 * @param {Object[]} entries
 * @param {string} cursor Optional parameter
 * @returns {Object}
 */
function createDropboxListFolderResponseWithEntries(entries, cursor) {
    var response = {
        entries: entries,
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
        return createResponseFileEntryFromVideoItem(videoItem);
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
function createResponseFileEntryFromVideoItem(videoItem) {
    var name = videoItem.videoName + '.foo';
    var pathDisplay = '/' + videoItem.playlistName.toLowerCase() + '/' + name;
    return createResponseFileEntry(name, pathDisplay);
}

/**
 * @param {string} name
 * @param {string} pathDisplay
 * @returns {Object}
 */
function createResponseFileEntry(name, pathDisplay) {
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
    expectedVideoItems.forEach(function (expectedVideoItem) {
        t.ok(videoItems.find(function (videoItem) {
            return (videoItem.playlistName === expectedVideoItem.playlistName &&
                videoItem.videoName === expectedVideoItem.videoName);
        }));
    });
}

/**
 * @param {Object} t Tape test object
 * @param {Error} error
 * @param {Object} videoItem
 */
function assertSaveError(t, error, videoItem) {
    t.ok(error.message.includes('unable to save stream'));
    t.ok(error.message.includes(JSON.stringify(videoItem)));
}

/**
 * @param {Object} t Tape test object
 * @param {Error} error
 */
function assertGetAllVideoItemsError(t, error) {
    t.ok(error.message.includes('unable to get all video items'));
}
