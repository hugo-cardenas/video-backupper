const test = require('blue-tape');
const path = require('path');
const fs = require('fs-promise');
const baserequire = require('base-require');
const fileHelper = baserequire('test/integration/helper/fileHelper');
const createFileStorage = baserequire('src/storage/fileStorage');


test.only('fileStorage - getAllVideoItems - succeeds', function (t) {
    const expectedVideos = [
        { id: 'videoId1', name: 'videoName1', playlistName: 'playlistName1' },
        { id: 'videoId2', name: 'videoName2', playlistName: 'playlistName2' },
        { id: 'videoId3', name: 'videoName3', playlistName: 'playlistName2' }
    ];

    let storage = null;

    return fileHelper.getTmpDir()
        .then((tmpDir) => {
            storage = createFileStorage(tmpDir);
            return tmpDir;
        })
        .then((tmpDir) => {
            return Promise.all([
                fs.ensureFile(path.join(tmpDir, 'playlistName1', 'videoName1_videoId1.foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName2_videoId2.foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName3_videoId3.foo'))
            ]);
        })
        .then(storage.getAllVideoItems)
        .then((storedVideos) => {
            t.equal(storedVideos.length, expectedVideos.length);
            expectedVideos.forEach((video) => {
                t.ok(storedVideos.includes(video));
            });
        });
});

test('fileStorage - getAllVideoItems - invalid video', function (t) {

});

test('fileStorage - getAllVideoItems - error reading dir', function (t) {

});

test('fileStorage - save - succeeds', function (t) {

});

test('fileStorage - save - validates video', function (t) {

});

test('fileStorage - save - error saving to file', function (t) {

});
