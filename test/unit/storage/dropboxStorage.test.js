var test = require('blue-tape');
var sinon = require('sinon');
var intoStream = require('into-stream');
var baserequire = require('base-require');
var createDropboxStorage = baserequire('src/storage/dropboxStorage');

// TODO
test.skip('dropboxStorage - save - succeeds', function (t) {
    var contents = 'foobar';
    var stream = intoStream(contents);

    var playlistId = 'playlist42';
    var videoId = 'video44';

    var expectedFolderPath = '/' + playlistId;
    var expectedFilePath = expectedFolderPath + '/' + videoId;

    var dropbox = {
        filesCreateFolder: sinon.stub(),
        filesUpload: sinon.stub()
    };

    dropbox.filesCreateFolder
        .withArgs({ path: expectedFolderPath })
        .returns(Promise.resolve());
    dropbox.filesCreateFolder.returns(Promise.reject());

    dropbox.filesUpload
        .withArgs({
            contents: contents,
            path: expectedFilePath
        })
        .returns(Promise.resolve());
    dropbox.filesCreateFolder.returns(Promise.reject());

    var storage = createDropboxStorage(dropbox);

    return storage.save(stream, playlistId, videoId);
});

test.skip('dropboxStorage - save - succeeds', function (t) {
    t.end();
});
