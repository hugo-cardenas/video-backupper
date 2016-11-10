var test = require('blue-tape');
var sinon = require('sinon');
var redis = require('redis');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var backupperLocator = baserequire('src/backupper/backupperLocator');
var queueLocator = baserequire('src/queue/queueLocator');
var configLocator = baserequire('src/config/configLocator');
var createConfig = baserequire('src/config/config');
var dropboxHelper = baserequire('test/integration/helper/dropboxHelper');

var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

test('queueBackupper - backup - succeeds', options, function (t) {
    setDropboxStorageConfig();

    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var videoId1 = '40T4IrLiCiU';
    var videoId2 = 'egjumMGKZCg';
    var videoId3 = '5y5MQMJmCxI';

    return flushRedis()
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
            console.log('Wait until jobs are finished');
            // Wait until jobs are finished
            var queue = getQueue();
            var numSucceeded = 0;
            return new Promise(function (resolve, reject) {
                queue.on('succeeded', function () {
                    numSucceeded++;
                    if (numSucceeded === 3) {
                        queue.close();
                        return resolve();
                    }
                });
            });
        })
        .then(function () {
            return dropboxHelper.listFiles('/' + playlistId);
        })
        .then(function (files) {
            t.ok(files.includes(buildDropboxPath(playlistId, videoId1)));
            t.ok(files.includes(buildDropboxPath(playlistId, videoId2)));
            t.ok(files.includes(buildDropboxPath(playlistId, videoId3)));
            resetConfig();
        })
        .then(quitRedis);
});

function buildDropboxPath(playlistId, videoId) {
    return ('/' + playlistId + '/' + videoId + '.mp4').toLowerCase();
}

function getQueueBackupper() {
    return backupperLocator.getBackupperManager().getQueueBackupper();
}

function getWorker() {
    return queueLocator.getQueueManager().getWorker();
}

function getQueue() {
    return queueLocator.getQueueManager().getQueue();
}

/**
 * Enable Dropbox storage in config
 */
function setDropboxStorageConfig() {
    var configArray = getConfigValue('');
    configArray.backupper.storage = 'dropbox';
    var newConfig = createConfig(configArray);
    configLocator.getConfigManager().getConfig = sinon.stub();
    configLocator.getConfigManager().getConfig.returns(newConfig);
}

/**
 * Reset config to original file specified
 */
function resetConfig() {
    configLocator.setConfigManager(null);
}

/**
 * @param {string} key
 * @returns {string|number|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

function flushRedis() {
    return new Promise(function (resolve, reject) {
        getRedisClient().flushdb(function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

function quitRedis() {
    return new Promise(function (resolve, reject) {
        getRedisClient().quit(function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

var redisClient;

/**
 * @returns {Object}
 */
function getRedisClient() {
    if (!redisClient) {
        redisClient = redis.createClient(
            getConfigValue('queue.redis')
        );
    }
    return redisClient;
}
