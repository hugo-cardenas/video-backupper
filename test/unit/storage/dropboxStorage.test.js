var test = require('blue-tape');
var sinon = require('sinon');
var Readable = require('stream').Readable;
var baserequire = require('base-require');
var createDropboxStorage = baserequire('src/storage/dropboxStorage');

test.skip('dropboxStorage - save - succeeds', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;
    var expectedFilePath = expectedFolderPath + '/' + videoId + '.mp4';

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
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId);
});

test.skip('dropboxStorage - save - folder exists', function (t) {
    var contents = 'foobar';

    var stream = createReadableStream(contents);
    var expectedBuffer = Buffer.from(contents);

    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;
    var expectedFilePath = expectedFolderPath + '/' + videoId + '.mp4';

    var dropbox = {
        filesCreateFolder: function () {},
        filesUpload: function () {}
    };

    var errorMessage = 'This is a random error';
    var folderCreationPromiseError = {
        error: errorMessage
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(folderCreationPromiseError));

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId);
});

test.skip('dropboxStorage - save - folder creation fails with non conflict error', function (t) {
    var stream = {};
    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;

    var dropbox = {
        filesCreateFolder: function () {}
    };

    var errorMessage = 'This is a random error';
    var folderCreationPromiseError = {
        error: errorMessage
    };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(folderCreationPromiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId)
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
            t.ok(err.message.includes(errorMessage));
            return Promise.resolve();
        });
});

test.skip('dropboxStorage - save - folder creation fails with non parsable error', function (t) {
    var stream = {};
    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;

    var dropbox = {
        filesCreateFolder: function () {}
    };

    var folderCreationPromiseError = {};

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(folderCreationPromiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId)
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
            t.ok(err.message.includes('Unable to parse response error'));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - dropbox upload fails', function (t) {
    t.end();
});

test('dropboxStorage - save - dropbox upload fails with unparsable error', function (t) {
    t.end();
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
