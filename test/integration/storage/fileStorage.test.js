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
                fs.ensureFile(path.join(tmpDir, 'playlistName1', 'videoName1 (videoId1).foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName2 (videoId2).foo')),
                fs.ensureFile(path.join(tmpDir, 'playlistName2', 'videoName3 (videoId3).foo'))
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
    ['playlist/video  (id).foo', { id: 'id', name: 'video ', playlistName: 'playlist' }],
    ['playlist/video (()(id--).foo', { id: '()(id--', name: 'video', playlistName: 'playlist' }],
    ['play.list/vid.eo (id).foo', { id: 'id', name: 'vid.eo', playlistName: 'play.list' }],
    ['play..list/vid..eo (id).foo', { id: 'id', name: 'vid..eo', playlistName: 'play..list' }],
    ['play (list)/(vid ( )eo) (id).foo', { id: 'id', name: '(vid ( )eo)', playlistName: 'play (list)' }]
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
    'foo (bar)',
    'foo(bar).baz', // Missing space before (id)
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
                t.ok(err.message.includes('unable to get all video items'));
                t.ok(err.message.includes(`Invalid file name "${fileName}"`));
            })
            .then(fileHelper.removeTmpDir);
    });
});

test('fileStorage - getAllVideoItems - error reading dir', function (t) {
    let baseDir;
    return fileHelper.getTmpDir()
        .then(tmpDir => {
            baseDir = tmpDir;
        })
        // Remove read rights from storage dir
        .then(() => fs.chmod(baseDir, '300'))
        .then(() => createFileStorage(baseDir))
        .then(storage => storage.getAllVideoItems())
        .then(() => t.fail())
        .catch(err => {
            t.ok(err.message.includes('unable to get all video items'));
            t.ok(err.message.includes('permission denied'));
            t.ok(err.message.includes(baseDir));
        })
        // We need to forcefully remove the dir (due to permissions, fileHelper won't clean automatically)
        .then(() => fs.rmdir(baseDir));
});

test('fileStorage - save - succeeds', function (t) {
    const videos = [
        createVideo('id1', 'name1', 'playlist1'),
        createVideo('id2', 'name2', 'playlist2'),
        createVideo('id3', 'name3', 'playlist2')
    ];

    const files = [
        './test/integration/storage/video1.mp4',
        './test/integration/storage/video2.mp4',
        './test/integration/storage/video3.mp4'
    ];

    const streams = files.map(file => fs.createReadStream(file));

    const extension = 'mp4';
    const expectedPaths = [
        `playlist1/name1 (id1).${extension}`,
        `playlist2/name2 (id2).${extension}`,
        `playlist2/name3 (id3).${extension}`
    ];

    let storage;
    let tmpDir;

    return fileHelper.getTmpDir()
        .then(dir => {
            tmpDir = dir;
        })
        .then(() => {
            storage = createFileStorage(tmpDir);
        })
        .then(() => {
            return Promise.all([
                storage.save(streams[0], videos[0]),
                storage.save(streams[1], videos[1]),
                storage.save(streams[2], videos[2])
            ]);
        })
        .then(() => {
            return Promise.all([
                assertFileContents(t, path.join(tmpDir, expectedPaths[0]), files[0]),
                assertFileContents(t, path.join(tmpDir, expectedPaths[1]), files[1]),
                assertFileContents(t, path.join(tmpDir, expectedPaths[2]), files[2])
            ]);
        })
        .then(fileHelper.removeTmpDir);
});

test('fileStorage - save - succeeds, overwrites file', function (t) {
    const video = createVideo('id1', 'name1', 'playlist1');

    const file1 = './test/integration/storage/video1.mp4';
    const file2 = './test/integration/storage/video2.mp4';

    const stream1 = fs.createReadStream(file1);
    const stream2 = fs.createReadStream(file2);

    const extension = 'mp4';
    const expectedPath = `playlist1/name1 (id1).${extension}`;

    let storage;
    let tmpDir;

    return fileHelper.getTmpDir()
        .then(dir => {
            tmpDir = dir;
        })
        .then(() => {
            storage = createFileStorage(tmpDir);
        })
        .then(() => storage.save(stream1, video))
        .then(() => assertFileContents(t, path.join(tmpDir, expectedPath), file1))
        // Overwrite stream2 into the same video
        .then(() => storage.save(stream2, video))
        // Now it should contain file2 contents
        .then(() => assertFileContents(t, path.join(tmpDir, expectedPath), file2))
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

test('fileStorage - save - error saving to file', function (t) {
    const video = createVideo('id1', 'name1', 'playlist1');

    const file = './test/integration/storage/video1.mp4';
    const stream = fs.createReadStream(file);

    const extension = 'mp4';

    let expectedPath;
    let storage;
    let tmpDir;

    return fileHelper.getTmpDir()
        .then(dir => {
            tmpDir = dir;
        })
        .then(() => {
            storage = createFileStorage(tmpDir);
        })
        .then(() => {
            expectedPath = path.join(tmpDir, `playlist1/name1 (id1).${extension}`);
        })
        // Create file in advance and remove write permissions
        .then(() => fs.ensureFile(expectedPath))
        .then(() => fs.chmod(expectedPath, '500'))
        // Save should fail
        .then(() => storage.save(stream, video))
        .then(() => t.fail())
        .catch(err => {
            t.ok(err.message.includes('unable to save stream'));
            t.ok(err.message.includes(JSON.stringify(video)));
            t.ok(err.message.includes('permission denied'));
            t.ok(err.message.includes(expectedPath));
        });
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

/**
 * @param {string} id
 * @param {string} name
 * @param {string} playlistName
 * @returns {Object}
 */
function createVideo(id, name, playlistName) {
    return { id, name, playlistName };
}
