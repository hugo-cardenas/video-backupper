var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createDropboxStorage = baserequire('src/storage/dropboxStorage');

// TODO
test.skip('dropboxStorage - save - succeeds', function (t) {
    var contents = 'foobar';
    var stream = intoStream(contents);

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
            contents: contents,
            path: expectedFilePath
        })
        .returns(Promise.resolve());

    var storage = createDropboxStorage(dropbox);

    return storage.save(stream, playlistId, videoId);
});

test.skip('dropboxStorage - save - succeeds', function (t) {
    t.end();
});
