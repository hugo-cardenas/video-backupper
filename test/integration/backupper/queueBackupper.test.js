var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var backupperLocator = baserequire('src/backupper/backupperLocator');
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

    return dropboxHelper.deleteAllFiles()
        .then(function () {
            // Queue all jobs for the playlist videos
            return getQueueBackupper().run(playlistId);
        })
        .then(function () {
            // Run workers to process the jobs

        })
        .then(function () {
            return dropboxHelper.listFiles('/' + playlistId);
        })
        .then(function (files) {
            t.ok(files.includes(playlistId + '/' + videoId1));
            t.ok(files.includes(playlistId + '/' + videoId2));
            t.ok(files.includes(playlistId + '/' + videoId3));
            resetConfig();
        });
});

function getQueueBackupper() {
    return backupperLocator.getBackupperManager().getQueueBackupper();
}

/**
 * Enable Dropbox storage in config
 */
function setDropboxStorageConfig() {
    var configArray = configLocator.getConfigManager().getConfig().get('');
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
