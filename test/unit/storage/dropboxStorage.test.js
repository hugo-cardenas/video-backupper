var test = require('blue-tape');
var sinon = require('sinon');
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
