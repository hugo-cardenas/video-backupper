const test = require('tape');
const sinon = require('sinon');
const baserequire = require('base-require');
const createStorageManager = baserequire('src/storage/storageManager');

test('storageManager - getStorage - s3 succeeds', function (t) {
    const s3StorageConfig = { bucket: 'bucket42' };

    const config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.s3').returns(s3StorageConfig);

    const s3 = { 'foo': 's3' };
    const Dropbox = function () {};

    const storageManager = createStorageManager(config, s3, Dropbox);

    const s3Storage = storageManager.getStorage('s3');
    t.ok(s3Storage);
    t.ok(s3Storage.hasOwnProperty('save'));
    t.end();
});

test('storageManager - getStorage - dropbox succeeds', function (t) {
    const dropboxToken = 'token42';

    const config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.dropbox.token').returns(dropboxToken);

    const s3 = {};
    const Dropbox = function () {};

    const storageManager = createStorageManager(config, s3, Dropbox);

    const s3Storage = storageManager.getStorage('dropbox');
    t.ok(s3Storage);
    t.ok(s3Storage.hasOwnProperty('save'));

    t.ok(config.get.calledWith('storage.dropbox.token'));
    t.end();
});

test('storageManager - getStorage - file succeeds', function (t) {
    const config = {
        get: sinon.stub()
    };
    config.get.withArgs('storage.file.baseDir').returns('baseDirFoo');

    const s3 = {};
    const Dropbox = () => {};

    const storageManager = createStorageManager(config, s3, Dropbox);
    const storage = storageManager.getStorage('file');

    t.ok(storage);
    t.ok(storage.hasOwnProperty('save'));
    t.ok(config.get.calledWith('storage.file.baseDir'));
    t.end();
});

test('storageManager - getStorage - invalid name', function (t) {
    const invalidName = 'invalidStorage';
    const config = {
        get: sinon.stub()
    };

    const s3 = {};
    const dropbox = {};

    const createS3Storage = sinon.stub();
    const createDropboxStorage = sinon.stub();
    const storageManager = createStorageManager(config, createS3Storage, s3, createDropboxStorage, dropbox);

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
    const config = {
        get: sinon.stub()
    };
    const configErrorMessage = 'Config key not found';
    config.get.withArgs('storage.s3').throws(new Error(configErrorMessage));

    const s3 = {};
    const dropbox = {};

    const createS3Storage = sinon.stub();
    const createDropboxStorage = sinon.stub();
    const storageManager = createStorageManager(config, createS3Storage, s3, createDropboxStorage, dropbox);

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
