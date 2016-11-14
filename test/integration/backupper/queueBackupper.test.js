var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var backupperLocator = baserequire('src/backupper/backupperLocator');
var queueLocator = baserequire('src/queue/queueLocator');
var configLocator = baserequire('src/config/configLocator');
var createConfig = baserequire('src/config/config');
var dropboxHelper = baserequire('test/integration/helper/dropboxHelper');
var redisHelper = baserequire('test/integration/helper/redisHelper');
var s3Helper = baserequire('test/integration/helper/s3Helper');

baseTest.setUp();
var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

test('queueBackupper - backup - succeeds with Dropbox storage', options, function (t) {
    enableDropboxStorage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var videoId1 = '40T4IrLiCiU';
    var videoId2 = 'egjumMGKZCg';
    var videoId3 = '5y5MQMJmCxI';

    return redisHelper.flushDb()
        .then(dropboxHelper.deleteAllFiles())
        .then(function () {
            // Queue all jobs for the playlist videos
            return getQueueBackupper().run(playlistId);
        })
        .then(function () {
            // Run workers to process the jobs
            getWorker().run();
        })
        .then(function () {
            // Wait until jobs are finished
            return waitForSuccededJobs(3);
        })
        .then(function () {
            return dropboxHelper.listFiles('/' + playlistId);
        })
        .then(function (files) {
            t.ok(files.includes(buildDropboxPath(playlistId, videoId1)));
            t.ok(files.includes(buildDropboxPath(playlistId, videoId2)));
            t.ok(files.includes(buildDropboxPath(playlistId, videoId3)));
            resetLocators();
        })
        .then(redisHelper.quit);
});

test('queueBackupper - backup - succeeds with S3 storage', options, function (t) {
    enableS3Storage();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var videoId1 = '40T4IrLiCiU';
    var videoId2 = 'egjumMGKZCg';
    var videoId3 = '5y5MQMJmCxI';

    return redisHelper.flushDb()
        .then(s3Helper.deleteAllKeys)
        .then(function () {
            // Queue all jobs for the playlist videos
            return getQueueBackupper().run(playlistId);
        })
        .then(function () {
            // Run workers to process the jobs
            getWorker().run();
        })
        .then(function () {
            // Wait until jobs are finished
            return waitForSuccededJobs(3);
        })
        .then(s3Helper.listKeys)
        .then(function (s3Keys) {
            t.equal(s3Keys.length, 3);
            t.ok(s3Keys.includes(buildS3Key(playlistId, videoId1)));
            t.ok(s3Keys.includes(buildS3Key(playlistId, videoId2)));
            t.ok(s3Keys.includes(buildS3Key(playlistId, videoId3)));
            resetLocators();
        })
        .then(redisHelper.quit);
});

/**
 * Wait until the number specified of jobs have succeeded
 * @param {number} numJobs
 * @returns {Promise}
 */
function waitForSuccededJobs(numJobs) {
    // Wait until jobs are finished
    var queue = getQueue();
    var numSucceeded = 0;
    return new Promise(function (resolve, reject) {
        queue.on('succeeded', function () {
            numSucceeded++;
            if (numSucceeded === numJobs) {
                queue.close();
                return resolve();
            }
        });
    });
}

/**
 * @param {string} playlistId
 * @param {string} videoId
 * @returns {string}
 */
function buildDropboxPath(playlistId, videoId) {
    return ('/' + playlistId + '/' + videoId + '.mp4').toLowerCase();
}

/**
 * @param {string} playlistId
 * @param {string} videoId
 * @returns {string}
 */
function buildS3Key(playlistId, videoId) {
    return playlistId + '/' + videoId + '.mp4';
}

/**
 * @returns {Object}
 */
function getQueueBackupper() {
    return backupperLocator.getBackupperManager().getQueueBackupper();
}

function resetLocators() {
    backupperLocator.setBackupperManager(null);
    configLocator.setConfigManager(null);
    queueLocator.setQueueManager(null);
}

/**
 * @returns {Object}
 */
function getWorker() {
    return queueLocator.getQueueManager().getWorker();
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
