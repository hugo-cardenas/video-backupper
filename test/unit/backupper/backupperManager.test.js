var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createBackupperManager = baserequire('src/backupper/backupperManager');

test('backupperManager - getQueueBackupper - succeeds', function (t) {
    var config = {
        get: sinon.stub()
    };
    var provider = {name: 'provider'};
    var ytdl = {name: 'ytdl'};
    var storageManager = {
        getStorage: sinon.stub()
    };
    var queue = {name: 'queue'};
    var displayOutput = {name: 'displayOutput'};

    var backupperManager = createBackupperManager(config, provider, ytdl, storageManager, queue, displayOutput);
    var backupper = backupperManager.getQueueBackupper();

    t.ok(backupper);
    t.ok(backupper.hasOwnProperty('run'));
    t.end();
});
