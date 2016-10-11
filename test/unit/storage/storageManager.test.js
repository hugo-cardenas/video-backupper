var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createStorageManager = baserequire('src/storage/storageManager');

test('storageManager - getStorage - succeeds', function (t) {
    var s3StorageConfig = ['s3Config'];
    var dropboxStorageConfig = ['dropboxConfig'];

    var config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.s3').returns(s3StorageConfig);
    config.get.withArgs('storage.dropbox').returns(dropboxStorageConfig);

    var s3 = {'foo': 's3'};
    var dropbox = {'bar': 'dropbox'};

    var s3Storage = {name: 's3Storage'};
    var createS3Storage = sinon.stub();
    createS3Storage.withArgs(s3, s3StorageConfig).returns(s3Storage);

    var dropboxStorage = {name: 'dropboxStorage'};
    var createDropboxStorage = sinon.stub();
    createDropboxStorage.withArgs(dropbox, dropboxStorageConfig).returns(dropboxStorage);

    var storageManager = createStorageManager(config, createS3Storage, s3, createDropboxStorage, dropbox);

    t.deepEqual(storageManager.getStorage('s3'), s3Storage);
    // TODO
    // t.deepEqual(storageManager.getStorage('dropbox'), dropboxStorage);
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
