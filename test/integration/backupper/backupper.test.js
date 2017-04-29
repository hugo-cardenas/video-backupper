var test = require('blue-tape');
var sinon = require('sinon');
var fs = require('fs-promise');
var path = require('path');
var baserequire = require('base-require');

var baseTest = baserequire('test/integration/baseTest');
var backupperLocator = baserequire('src/backupper/backupperLocator');
var queueLocator = baserequire('src/queue/queueLocator');
var configLocator = baserequire('src/config/configLocator');
var backupperStorageLocator = baserequire('src/backupper/storageLocator');
var storageLocator = baserequire('src/storage/storageLocator');
var dropboxHelper = baserequire('test/integration/helper/dropboxHelper');

var redisHelper = baserequire('test/integration/helper/redisHelper');
var s3Helper = baserequire('test/integration/helper/s3Helper');
var configHelper = baserequire('test/integration/helper/configHelper');
var fileHelper = baserequire('test/integration/helper/fileHelper');

baseTest.setUp();
var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

test('backupper - backupPlaylist - succeeds with Dropbox storage', options, function (t) {
    enableDropboxStorage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'test playlist 01';

    var expectedVideos = [
        { id: '40T4IrLiCiU', name: 'video 01' },
        { id: 'egjumMGKZCg', name: 'video 02' },
        { id: '5y5MQMJmCxI', name: 'video 03' }
    ];

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runPlaylistBackupAndWait(playlistId, 3);
        })
        .then(function () {
            return assertDropboxContainsPlaylistVideos(t, playlistName, expectedVideos);
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backupPlaylist - succeeds with Dropbox storage, skips already backed up videos', options, function (t) {
    enableDropboxStorage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'test playlist 01';

    var expectedVideos = [
        { id: '40T4IrLiCiU', name: 'video 01' },
        { id: 'egjumMGKZCg', name: 'video 02' },
        { id: '5y5MQMJmCxI', name: 'video 03' }
    ];

    var queue = getQueue();
    var queueSpy = sinon.spy(queue, 'createJob');

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runPlaylistBackupAndWait(playlistId, 3);
        })
        .then(function () {
            // Delete one stored file and backup again - should create only 1 job
            return dropboxHelper.deleteFile(buildDropboxPath(playlistName, expectedVideos[1].name, expectedVideos[1].id));
        })
        .then(function () {
            // Run backup again for one single video, wait until the single job is finished
            return runPlaylistBackupAndWait(playlistId, 1, false);
        })
        .then(function (files) {
            // Check that only 4 jobs are created - 3 original video files + 1 saved again
            t.equal(queueSpy.callCount, 4, 'Queue createJob is called only 4 times (3+1 videos)');
            return assertDropboxContainsPlaylistVideos(t, playlistName, expectedVideos);
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backupPlaylist - succeeds with S3 storage', options, function (t) {
    enableS3Storage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'test playlist 01';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 01';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 02';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 03';

    return redisHelper.flushDb()
        .then(s3Helper.deleteAllKeys)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runPlaylistBackupAndWait(playlistId, 3);
        })
        .then(s3Helper.listKeys)
        .then(function (s3Keys) {
            t.equal(s3Keys.length, 3);
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName1, videoId1)));
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName2, videoId2)));
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName3, videoId3)));
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backupPlaylist - succeeds with S3 storage, skips already backed up videos', options, function (t) {
    enableS3Storage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'test playlist 01';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 01';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 02';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 03';

    var queue = getQueue();
    var queueSpy = sinon.spy(queue, 'createJob');

    return redisHelper.flushDb()
        .then(s3Helper.deleteAllKeys)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runPlaylistBackupAndWait(playlistId, 3);
        })
        .then(function () {
            // Delete one stored file and backup again - should create only 1 job
            return s3Helper.deleteKeys([buildS3Key(playlistName, videoName2, videoId2)]);
        })
        .then(function () {
            // Run backup again for one single video, wait until the single job is finished
            return runPlaylistBackupAndWait(playlistId, 1, false);
        })
        .then(s3Helper.listKeys)
        .then(function (s3Keys) {
            // Check that only 4 jobs are created - 3 original video files + 1 saved again
            t.equal(queueSpy.callCount, 4, 'Queue createJob is called only 4 times (3+1 videos)');
            t.equal(s3Keys.length, 3);
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName1, videoId1)));
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName2, videoId2)));
            t.ok(s3Keys.includes(buildS3Key(playlistName, videoName3, videoId3)));
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backupPlaylist - succeeds with file storage', options, function (t) {
    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'test playlist 01';

    var expectedVideos = [
        { id: '40T4IrLiCiU', name: 'video 01' },
        { id: 'egjumMGKZCg', name: 'video 02' },
        { id: '5y5MQMJmCxI', name: 'video 03' }
    ];

    let baseDir;

    return fileHelper.getTmpDir()
        .then(tmpDir => {
            baseDir = tmpDir;
        })
        .then(() => enableFileStorage(baseDir))
        .then(redisHelper.flushDb)
        // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
        .then(() => runPlaylistBackupAndWait(playlistId, 3))
        .then(() => assertDirContainsPlaylistVideos(t, baseDir, playlistName, expectedVideos))
        .then(() => getQueue().close())
        .then(resetLocators)
        .then(fileHelper.removeTmpDir)
        .then(redisHelper.quit);
});

test('backupper - backupChannel - succeeds with Dropbox storage', options, function (t) {
    enableDropboxStorage();

    var channelId = 'UCX-DMXPI5qgrpb2e9gqCt0Q';

    var playlistName1 = 'test playlist 01';
    var playlistName2 = 'test playlist 02';

    // Playlist 01
    var expectedVideos1 = [
        { id: '40T4IrLiCiU', name: 'video 01' },
        { id: 'egjumMGKZCg', name: 'video 02' },
        { id: '5y5MQMJmCxI', name: 'video 03' }
    ];

    // Playlist 02
    var expectedVideos2 = [
        { id: 'fhj5h9KJmAo', name: 'video 04' },
        { id: 'gtkdENp8fWY', name: 'video 05' }
    ];

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles)
        .then(function () {
            // Queue all jobs for the channel videos, run worker and wait until jobs are finished
            return runChannelBackupAndWait(channelId, 5);
        })
        .then(function () {
            return Promise.all([
                assertDropboxContainsPlaylistVideos(t, playlistName1, expectedVideos1),
                assertDropboxContainsPlaylistVideos(t, playlistName2, expectedVideos2)
            ]);
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

/**
 * @returns {Object}
 */
function getWorker() {
    return queueLocator.getQueueManager().getWorker();
}

/**
 * Run playlist backup and Wait until the number specified of jobs have succeeded
 * @param {string} playlistId
 * @param {number} numJobs
 * @param {boolean} [runWorker=true] Launch worker after setting the wait for succeeded jobs
 * @returns {Promise}
 */
function runPlaylistBackupAndWait(playlistId, numJobs, runWorker = true) {
    var backupFunction = getBackupper().backupPlaylist.bind(this, playlistId);
    return runBackupAndWait(backupFunction, numJobs, runWorker);
}

/**
 * Run channel backup and Wait until the number specified of jobs have succeeded
 * @param {string} channelId
 * @param {number} numJobs
 * @param {boolean} [runWorker=true] Launch worker after setting the wait for succeeded jobs
 * @returns {Promise}
 */
function runChannelBackupAndWait(channelId, numJobs, runWorker = true) {
    var backupFunction = getBackupper().backupChannel.bind(this, channelId);
    return runBackupAndWait(backupFunction, numJobs, runWorker);
}

/**
 * @param {function} backupCallback
 * @param {number} numJobs
 * @param {boolean} runWorker
 * @returns {Promise}
 */
function runBackupAndWait(backupFunction, numJobs, runWorker) {
    // Wait until jobs are finished
    var queue = getQueue();
    var numSucceeded = 0;
    return new Promise(function (resolve, reject) {
        queue.on('succeeded', function () {
            numSucceeded++;
            if (numSucceeded === numJobs) {
                return resolve();
            }
        });
        if (runWorker) {
            getWorker().run();
        }
        backupFunction();
    });
}

/**
 * @param {string} playlistName
 * @param {string} videoName
 * @param {string} videoId
 * @returns {string}
 */
function buildDropboxPath(playlistName, videoName, videoId) {
    return (`/${playlistName}/${videoName} (${videoId}).mp4`).toLowerCase();
}

/**
 * @param {string} playlistName
 * @param {string} videoName
 * @returns {string}
 */
function buildS3Key(playlistName, videoName, videoId) {
    return `${playlistName}/${videoName} (${videoId}).mp4`;
}

/**
 * @returns {Object}
 */
function getBackupper() {
    return backupperLocator.getBackupperManager().getBackupper();
}

function resetLocators() {
    backupperLocator.setBackupperManager(null);
    configLocator.setConfigManager(null);
    queueLocator.setQueueManager(null);
    backupperStorageLocator.setBackupperStorageManager(null);
    storageLocator.setStorageManager(null);
}

/**
 * @returns {Object}
 */
function getQueue() {
    return queueLocator.getQueueManager().getQueue();
}

function enableDropboxStorage() {
    enableBackupperStorage('dropbox');
}

function enableS3Storage() {
    enableBackupperStorage('s3');
}

/**
 * @param {string} baseDir
 */
function enableFileStorage(baseDir) {
    enableBackupperStorage('file');
    setFileStorageBaseDir(baseDir);
}

/**
 * @param {string} baseDir
 */
function setFileStorageBaseDir(baseDir) {
    configHelper.overrideConfig({
        storage: {
            file: { baseDir }
        }
    });
}

/**
 * Enable storage in config
 * @param {string} storageName
 */
function enableBackupperStorage(storageName) {
    configHelper.overrideConfig({
        backupper: { storage: storageName }
    });
}

/**
 * @param {Object} t Test object
 * @param {string} playlistName
 * @param {Object[]} videos Array of video objects {id, name}
 * @returns {Promise}
 */
function assertDropboxContainsPlaylistVideos(t, playlistName, videos) {
    return dropboxHelper.listFiles('/' + playlistName)
        .then(function (files) {
            t.equal(files.length, videos.length, `There are ${videos.length} files stored`);
            videos.forEach(function (video) {
                const path = buildDropboxPath(playlistName, video.name, video.id);
                t.ok(files.includes(path), `Stored files contain ${path}}`);
            });
        });
}

/**
 * @param {Object} t Test object
 * @param {string} playlistName
 * @param {Object[]} videos Array of video objects {id, name}
 * @returns {Promise}
 */
function assertDirContainsPlaylistVideos(t, baseDir, playlistName, videos) {
    return fs.readdir(path.join(baseDir, playlistName))
        .then(items => {
            t.equal(items.length, videos.length);
            videos.forEach(video => {
                const file = `${video.name} (${video.id}).mp4`;
                t.ok(items.includes(file));
            });
        });
}
