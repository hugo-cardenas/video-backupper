var test = require('tape');
var baserequire = require('base-require');
var createBackupperManager = baserequire('src/backupper/backupperManager');

test('backupperManager - getBackupper - succeeds', function (t) {
    var provider = {};
    var storage = {};
    var queue = {};
    var displayOutput = {};

    var backupperManager = createBackupperManager(provider, storage, queue, displayOutput);
    var backupper = backupperManager.getBackupper();

    t.ok(backupper);
    t.ok(backupper.hasOwnProperty('backupPlaylist'));
    t.ok(backupper.hasOwnProperty('backupChannel'));
    t.end();
});
