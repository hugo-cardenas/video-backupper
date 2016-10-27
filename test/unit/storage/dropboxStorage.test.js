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
            mode: {'.tag': 'overwrite'},
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId);
});

test('dropboxStorage - save - folder exists', function (t) {
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
            mode: {'.tag': 'overwrite'},
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId);
});

test('dropboxStorage - save - folder creation fails with non solvable error', function (t) {
    var stream = {};
    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;

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
    return storage.save(stream, playlistId, videoId)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
            t.ok(err.message.includes(errorMessage));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - folder creation fails with non parsable error', function (t) {
    var stream = {};
    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;

    var dropbox = {
        filesCreateFolder: function () {}
    };

    var promiseError = { foo: 'Non parsable error' };

    sinon.mock(dropbox).expects('filesCreateFolder')
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
            t.ok(err.message.includes('Unable to parse response error'));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - upload fails', function (t) {
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

    var errorMessage = 'Upload has failed';
    var promiseError = {
        error: errorMessage
    };

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: {'.tag': 'overwrite'},
            path: expectedFilePath
        })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId)
        .then(function () {
            t.fail('Should throw error');
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
            t.ok(err.message.includes(errorMessage));
            t.equal(VError.info(VError.cause(err)).responseError, JSON.stringify(promiseError));
            return Promise.resolve();
        });
});

test('dropboxStorage - save - upload fails with non parsable error', function (t) {
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

    var promiseError = { foo: 'Non parsable error' };

    sinon.mock(dropbox).expects('filesUpload')
        .withArgs({
            contents: expectedBuffer,
            mode: {'.tag': 'overwrite'},
            path: expectedFilePath
        })
        .returns(Promise.reject(promiseError));

    var storage = createDropboxStorage(dropbox);
    return storage.save(stream, playlistId, videoId)
        .catch(function (err) {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(videoId));
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
