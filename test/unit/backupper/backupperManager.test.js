var test = require('tape');
var baserequire = require('base-require');
var createBackupperManager = baserequire('src/backupper/backupperManager');

test('backupperManager - getQueueBackupper - succeeds', function (t) {
    var provider = {};
    var storage = {};
    var queue = {};
    var displayOutput = {};

    var backupperManager = createBackupperManager(provider, storage, queue, displayOutput);
    var backupper = backupperManager.getQueueBackupper();

    t.ok(backupper);
    t.ok(backupper.hasOwnProperty('backupVideos'));
    t.end();
});
