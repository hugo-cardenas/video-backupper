var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createBackupperStorageManager = baserequire('src/backupper/storageManager');

test('storageManager - getBackupperStorage - succeeds', function (t) {
    var storageName = 'storageFoo';
    var config = {
        get: sinon.stub()
            .withArgs('backupper.storage')
            .returns(storageName)
    };
    var storage = {};
    var storageManager = {
        getStorage: sinon.stub()
            .withArgs(storageName)
            .returns(storage)
    };

    var backupperStorageManager = createBackupperStorageManager(config, storageManager);
    var backupperStorage = backupperStorageManager.getBackupperStorage();

    t.ok(backupperStorage, 'Backupper storage is not falsy');
    t.equal(backupperStorageManager.getBackupperStorage(), backupperStorage, 'Backupper storage is cached in manager');
    t.ok(storageManager.getStorage.calledWith(storageName), 'Storage manager is called with storage name');
    t.end();
});

test('storageManager - getBackupperStorage - config fails', function (t) {
    var errorMessage = 'Failure to get config';
    var config = {
        get: sinon.stub()
            .withArgs('backupper.storage')
            .throws(new Error(errorMessage))
    };
    var storageManager = {
        getStorage: sinon.stub()
    };

    var backupperStorageManager = createBackupperStorageManager(config, storageManager);

    try {
        backupperStorageManager.getBackupperStorage();
        t.fail('Should throw Error');
    } catch (err) {
        assertGetStorageError(t, err);
        t.ok(err.message.includes(errorMessage), 'Contains config error message');
        t.end();
    }
});

test('storageManager - getBackupperStorage - storageManager fails', function (t) {
    var storageName = 'storageFoo';
    var config = {
        get: sinon.stub()
            .withArgs('backupper.storage')
            .returns(storageName)
    };

    var errorMessage = 'Failure to get storage';
    var storageManager = {
        getStorage: sinon.stub()
            .withArgs(storageName)
            .throws(new Error(errorMessage))
    };

    var backupperStorageManager = createBackupperStorageManager(config, storageManager);

    try {
        backupperStorageManager.getBackupperStorage();
        t.fail('Should throw Error');
    } catch (err) {
        assertGetStorageError(t, err);
        t.ok(err.message.includes(errorMessage), 'Contains internal storageManager error message');
        t.end();
    }
});

/**
 * @param {Object} t Tape test object
 * @param {Error} err
 */
function assertGetStorageError(t, err) {
    t.ok(err.message.includes('Unable to get backupper storage'), 'Contains main error message');
}
