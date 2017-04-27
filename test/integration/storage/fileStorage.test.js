const test = require('blue-tape');
const path = require('path');
const fs = require('fs-promise');
const _ = require('lodash');
const baserequire = require('base-require');
const fileHelper = baserequire('test/integration/helper/fileHelper');
const createFileStorage = baserequire('src/storage/fileStorage');

test('fileStorage - getAllVideoItems - succeeds', function (t) {
    const expectedVideos = [
        { id: 'videoId1', name: 'videoName1', playlistName: 'playlistName1' },
        { id: 'videoId2', name: 'videoName2', playlistName: 'playlistName2' },
        { id: 'videoId3', name: 'videoName3', playlistName: 'playlistName2' }
    ];

    let storage = null;

    return fileHelper.getTmpDir()
        .then(tmpDir => {
            storage = createFileStorage(tmpDir);
            return tmpDir;
        })
        .then(tmpDir => {
            return Promise.all([
                fs.ensureFile(path.join(tmpDir, 'playlistName1', 'videoName1_videoId1.foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName2_videoId2.foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName3_videoId3.foo'))
            ]);
        })
        .then(() => storage.getAllVideoItems())
        .then(storedVideos => assertVideos(t, storedVideos, expectedVideos))
        .then(fileHelper.removeTmpDir);
});

/**
 * [path, expectedVideo]
 */
const trickyVideos = [
    ['play.list/vid.eo_id.foo', { id: 'id', name: 'vid.eo', playlistName: 'play.list' }],
    ['play..list/vid..eo_id.foo', { id: 'id', name: 'vid..eo', playlistName: 'play..list' }],
    ['play_list/vid_eo_id.foo', { id: 'id', name: 'vid_eo', playlistName: 'play_list' }]
];

trickyVideos.forEach((element, index) => {
    test('fileStorage - getAllVideoItems - succeeds with tricky name #' + index, function (t) {
        const filePath = element[0];
        const expectedVideo = element[1];

        let storage = null;

        return fileHelper.getTmpDir()
            .then(tmpDir => {
                storage = createFileStorage(tmpDir);
                return tmpDir;
            })
            .then(tmpDir => fs.ensureFile(path.join(tmpDir, filePath)))
            .then(() => storage.getAllVideoItems())
            .then(storedVideos => assertVideos(t, storedVideos, [expectedVideo]))
            .then(fileHelper.removeTmpDir);
    });
});

const invalidFileNames = [
    'foo',
    'foo_bar',
    'foo.baz'
];

invalidFileNames.forEach((fileName, index) => {
    test('fileStorage - getAllVideoItems - invalid file #' + index, function (t) {
        let storage = null;

        return fileHelper.getTmpDir()
            .then(tmpDir => {
                storage = createFileStorage(tmpDir);
                return tmpDir;
            })
            .then(tmpDir =>
                fs.ensureFile(path.join(tmpDir, 'playlistName', fileName))
            )
            .then(() => storage.getAllVideoItems())
            .then(() => t.fail())
            .catch(err => {
                t.ok('unable to get all video items');
                t.ok(err.message.includes(`Invalid file name "${fileName}"`));
            })
            .then(fileHelper.removeTmpDir);
    });
});

test.skip('fileStorage - getAllVideoItems - error reading dir', function (t) {

});

test('fileStorage - save - succeeds', function (t) {
    const video = {
        id: 'videoId',
        name: 'videoName',
        playlistName: 'playlistName'
    };

    const file = './test/integration/storage/video1.mp4';
    const stream = fs.createReadStream(file);

    const extension = 'mp4';
    const expectedPath = `${video.playlistName}/${video.name}_${video.id}.${extension}`;

    let storage;
    let tmpDir;

    return fileHelper.getTmpDir()
        .then(dir => {
            tmpDir = dir;
        })
        .then(() => {
            storage = createFileStorage(tmpDir);
        })
        .then(() => storage.save(stream, video))
        .then(() => assertFileContents(t, path.join(tmpDir, expectedPath), file))
        .then(fileHelper.removeTmpDir);
});

var invalidVideos = [
    {},
    { id: 'foo' },
    { name: 'foo' },
    { id: 'foo', name: 'bar' },
    { playlistName: 'foo' },
    { id: 'foo', playlistName: 'bar' },
    { id: 'foo/', name: 'bar/', playlistName: 'baz/' }
];

invalidVideos.forEach((video, index) => {
    test('fileStorage - save - validates video #' + index, function (t) {
        const stream = 'stream';
        let storage = null;

        return fileHelper.getTmpDir()
            .then(tmpDir => {
                storage = createFileStorage(tmpDir);
                return tmpDir;
            })
            .then(tmpDir => storage.save(stream, video))
            .then(() => t.fail())
            .catch(err => {
                t.ok(err.message.includes('Invalid video'));
                t.ok(err.message.includes(JSON.stringify(video)));
            })
            .then(fileHelper.removeTmpDir);
    });
});


test.skip('fileStorage - save - error saving to file', function (t) {

});

/**
 * @param {Object} t Test object
 * @param {Object[]} storedVideos
 * @param {Object[]} expectedVideos
 */
function assertVideos(t, storedVideos, expectedVideos) {
    t.equal(storedVideos.length, expectedVideos.length);
    expectedVideos.forEach((video) => {
        var foundItem = storedVideos.find(function (storedVideo) {
            return _.isEqual(video, storedVideo);
        });
        t.ok(foundItem, 'Item ' + JSON.stringify(video) + ' is found in stored items');
    });
}

/**
 * @param {string} file
 * @param {string} expectedFile
 * @returns {Promise}
 */
function assertFileContents(t, file, expectedFile) {
    const promises = [
        fileHelper.getStreamBuffer(fs.createReadStream(file)),
        fileHelper.getStreamBuffer(fs.createReadStream(expectedFile))
    ];

    return Promise.all(promises)
        .then(function (values) {
            var buffer = values[0];
            var expectedBuffer = values[1];
            t.ok(buffer.toString('binary') === expectedBuffer.toString('binary'), 'Buffers are equal');
        });
}
