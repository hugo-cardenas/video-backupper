var test = require('blue-tape');
var sinon = require('sinon');
var crypto = require('crypto');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var backupperLocator = baserequire('src/backupper/backupperLocator');
var queueLocator = baserequire('src/queue/queueLocator');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/backupper/storageLocator');
var createConfig = baserequire('src/config/config');
var dropboxHelper = baserequire('test/integration/helper/dropboxHelper');
var redisHelper = baserequire('test/integration/helper/redisHelper');
var s3Helper = baserequire('test/integration/helper/s3Helper');

baseTest.setUp();
var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

test('backupper - backup - succeeds with Dropbox storage', options, function (t) {
    enableDropboxStorage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'nyancat playlist';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 1';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 2';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 3';

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runBackupAndWaitForSucceededJobs(playlistId, 3, true);
        })
        .then(function () {
            return dropboxHelper.listFiles('/' + playlistName);
        })
        .then(function (files) {
            t.equal(files.length, 3, 'There are 3 files stored');
            var expectedPaths = [
                buildDropboxPath(playlistName, videoName1, videoId1),
                buildDropboxPath(playlistName, videoName2, videoId2),
                buildDropboxPath(playlistName, videoName3, videoId3)
            ];
            t.ok(files.includes(expectedPaths[0]), `Stored files contain ${expectedPaths[0]}}`);
            t.ok(files.includes(expectedPaths[1]), `Stored files contain ${expectedPaths[1]}}`);
            t.ok(files.includes(expectedPaths[2]), `Stored files contain ${expectedPaths[2]}}`);
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backup - succeeds with Dropbox storage, skips already backed up videos', options, function (t) {
    enableDropboxStorage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'nyancat playlist';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 1';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 2';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 3';

    var queue = getQueue();
    var queueSpy = sinon.spy(queue, 'createJob');

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runBackupAndWaitForSucceededJobs(playlistId, 3, true);
        })
        .then(function () {
            // Delete one stored file and backup again - should create only 1 job
            return dropboxHelper.deleteFile(buildDropboxPath(playlistName, videoName2, videoId2));
        })
        .then(function () {
            // Run backup again for one single video, wait until the single job is finished
            return runBackupAndWaitForSucceededJobs(playlistId, 1, false);
        })
        .then(function () {
            return dropboxHelper.listFiles('/' + playlistName);
        })
        .then(function (files) {
            // Check that only 4 jobs are created - 3 original video files + 1 saved again
            t.equal(queueSpy.callCount, 4, 'Queue createJob is called only 4 times (3+1 videos)');
            t.equal(files.length, 3, 'There are 3 files stored');
            t.ok(files.includes(buildDropboxPath(playlistName, videoName1, videoId1)));
            t.ok(files.includes(buildDropboxPath(playlistName, videoName2, videoId2)));
            t.ok(files.includes(buildDropboxPath(playlistName, videoName3, videoId3)));
        })
        .then(function () {
            getQueue().close();
        })
        .then(resetLocators)
        .then(redisHelper.quit);
});

test('backupper - backup - succeeds with S3 storage', options, function (t) {
    enableS3Storage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'nyancat playlist';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 1';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 2';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 3';

    return redisHelper.flushDb()
        .then(s3Helper.deleteAllKeys)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runBackupAndWaitForSucceededJobs(playlistId, 3, true);
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

test('backupper - backup - succeeds with S3 storage, skips already backed up videos', options, function (t) {
    enableS3Storage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var playlistName = 'nyancat playlist';

    var videoId1 = '40T4IrLiCiU';
    var videoName1 = 'video 1';

    var videoId2 = 'egjumMGKZCg';
    var videoName2 = 'video 2';

    var videoId3 = '5y5MQMJmCxI';
    var videoName3 = 'video 3';

    var queue = getQueue();
    var queueSpy = sinon.spy(queue, 'createJob');

    return redisHelper.flushDb()
        .then(s3Helper.deleteAllKeys)
        .then(function () {
            // Queue all jobs for the playlist videos, run worker and wait until jobs are finished
            return runBackupAndWaitForSucceededJobs(playlistId, 3, true);
        })
        .then(function () {
            // Delete one stored file and backup again - should create only 1 job
            return s3Helper.deleteKeys([buildS3Key(playlistName, videoName2, videoId2)]);
        })
        .then(function () {
            // Run backup again for one single video, wait until the single job is finished
            return runBackupAndWaitForSucceededJobs(playlistId, 1, false);
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

/**
 * @returns {Object}
 */
function getWorker() {
    return queueLocator.getQueueManager().getWorker();
}

/**
 * Wait until the number specified of jobs have succeeded
 * @param {number} numJobs
 * @param {boolean} runWorker Launch worker after setting the wait for succeeded jobs
 * @returns {Promise}
 */
function runBackupAndWaitForSucceededJobs(playlistId, numJobs, runWorker) {
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
        getBackupper().backupPlaylist(playlistId);
    });
}

/**
 * @param {string} playlistName
 * @param {string} videoName
 * @param {string} videoId
 * @returns {string}
 */
function buildDropboxPath(playlistName, videoName, videoId) {
    const id = buildVideoId(videoId, playlistName);
    return (`/${playlistName}/${videoName}_${id}.mp4`).toLowerCase();
}

/**
 * @param {string} playlistName
 * @param {string} videoName
 * @returns {string}
 */
function buildS3Key(playlistName, videoName, videoId) {
    const id = buildVideoId(videoId, playlistName);
    return `${playlistName}/${videoName}_${id}.mp4`;
}

/**
 * @param {string} providerVideoId
 * @param {string} playlistName
 * @returns {string}
 */
function buildVideoId(providerVideoId, playlistName) {
    return sha256(providerVideoId + '_' + playlistName);
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
    storageLocator.setBackupperStorageManager(null);
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
 * Enable storage in config
 * @param {string} storageName
 */
function enableBackupperStorage(storageName) {
    var configArray = getConfigValue('');
    configArray.backupper.storage = storageName;
    var newConfig = createConfig(configArray);
    configLocator.getConfigManager().getConfig = sinon.stub();
    configLocator.getConfigManager().getConfig.returns(newConfig);
}

/**
 * @param {string} key
 * @returns {string|number|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

/**
 * @param {string} value
 * @returns {string}
 */
function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
