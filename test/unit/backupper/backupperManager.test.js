var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createBackupperManager = baserequire('src/backupper/backupperManager');

test('backupperManager - getBackupper - succeeds', function (t) {
    var config = {
        get: sinon.stub()
    };
    var provider = {name: 'provider'};
    var ytdl = {name: 'ytdl'};
    var storageManager = {
        getStorage: sinon.stub()
    };
    var displayOutput = {name: 'displayOutput'};

    var storage = {name: 'storage'};
    var storageName = 'myStorage';
    config.get.withArgs('backupper.storage').returns(storageName);
    storageManager.getStorage.withArgs(storageName).returns(storage);

    var backupperManager = createBackupperManager(config, provider, ytdl, storageManager, displayOutput);
    var backupper = backupperManager.getBackupper();

    t.ok(backupper);
    t.ok(backupper.hasOwnProperty('run'));
    t.end();
});

test('backupperManager - getBackupper - missing config', function (t) {
    var config = {
        get: sinon.stub()
    };
    var provider = {name: 'provider'};
    var ytdl = {name: 'ytdl'};
    var storageManager = {
        getStorage: sinon.stub()
    };
    var displayOutput = {name: 'displayOutput'};

    var configErrorMessage = 'Missing config key';
    config.get.withArgs('backupper.storage').throws(new Error(configErrorMessage));

    var backupperManager = createBackupperManager(config, provider, ytdl, storageManager, displayOutput);
    try {
        backupperManager.getBackupper();
        t.fail('Should throw error for missing backupper config');
    } catch (err) {
        t.ok(err.message.includes('Unable to create backupper'));
        t.ok(err.message.includes(configErrorMessage));
        t.end();
    }
});

test('backupperManager - getBackupper - invalid storage name', function (t) {
    var config = {
        get: sinon.stub()
    };
    var provider = {name: 'provider'};
    var ytdl = {name: 'ytdl'};
    var storageManager = {
        getStorage: sinon.stub()
    };
    var displayOutput = {name: 'displayOutput'};

    var storageName = 'myStorage';
    var storageManagerErrorMessage = 'Invalid storage name';
    config.get.withArgs('backupper.storage').returns(storageName);
    storageManager.getStorage.withArgs(storageName).throws(new Error(storageManagerErrorMessage));

    var backupperManager = createBackupperManager(config, provider, ytdl, storageManager, displayOutput);
    try {
        backupperManager.getBackupper();
        t.fail('Should throw error for invalid backupper config');
    } catch (err) {
        t.ok(err.message.includes('Unable to create backupper'));
        t.ok(err.message.includes(storageManagerErrorMessage));
        t.end();
    }
});
