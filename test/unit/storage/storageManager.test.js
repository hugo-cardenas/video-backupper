var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createStorageManager = baserequire('src/storage/storageManager');

test('storageManager - getStorage - s3 succeeds', function (t) {
    var s3StorageConfig = { bucket: 'bucket42' };

    var config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.s3').returns(s3StorageConfig);

    var s3 = { 'foo': 's3' };
    var Dropbox = function () {};

    var storageManager = createStorageManager(config, s3, Dropbox);

    var s3Storage = storageManager.getStorage('s3');
    t.ok(s3Storage);
    t.ok(s3Storage.hasOwnProperty('save'));
    t.end();
});

test('storageManager - getStorage - dropbox succeeds', function (t) {
    var dropboxToken = 'token42';

    var config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.dropbox.token').returns(dropboxToken);

    var s3 = {};
    var Dropbox = function () {};

    var storageManager = createStorageManager(config, s3, Dropbox);

    var s3Storage = storageManager.getStorage('dropbox');
    t.ok(s3Storage);
    t.ok(s3Storage.hasOwnProperty('save'));

    t.ok(config.get.calledWith('storage.dropbox.token'));
    t.end();
});

test('storageManager - getStorage - invalid name', function (t) {
    var invalidName = 'invalidStorage';
    var config = {
        get: sinon.stub()
    };

    var s3 = {};
    var dropbox = {};

    var createS3Storage = sinon.stub();
    var createDropboxStorage = sinon.stub();
    var storageManager = createStorageManager(config, createS3Storage, s3, createDropboxStorage, dropbox);

    try {
        storageManager.getStorage(invalidName);
        t.fail('Should throw error for invalid storage name');
    } catch (err) {
        t.ok(err.message.includes('Invalid storage name'));
        t.ok(err.message.includes(invalidName));
        t.end();
    }
});

test('storageManager - getStorage - missing config', function (t) {
    var config = {
        get: sinon.stub()
    };
    var configErrorMessage = 'Config key not found';
    config.get.withArgs('storage.s3').throws(new Error(configErrorMessage));

    var s3 = {};
    var dropbox = {};

    var createS3Storage = sinon.stub();
    var createDropboxStorage = sinon.stub();
    var storageManager = createStorageManager(config, createS3Storage, s3, createDropboxStorage, dropbox);

    try {
        storageManager.getStorage('s3');
        t.fail('Should throw error for storage config not found');
    } catch (err) {
        t.ok(err.message.includes('Invalid config for storage'));
        t.ok(err.message.includes('s3'));
        t.ok(err.message.includes(configErrorMessage));
        t.end();
    }
});
