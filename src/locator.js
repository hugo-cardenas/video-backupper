var aws = require('aws-sdk');
var google = require('googleapis');
var ytdl = require('ytdl-core');
var jsonfile = require('jsonfile');

var createBackupper = require('./backupper');
var createProvider = require('./provider');
var createStorage = require('./storage');
var createConfigManager = require('./config/configManager');

var s3;

var backupper;
var provider;
var storage;
var configManager;

function getS3() {
    if (!s3) {
        s3 = new aws.S3();
    }
    return s3;
}

function getConfigManager() {
    if (!configManager) {
        configManager = createConfigManager();
    }
    return configManager;
}

function getConfig() {
    return getConfigManager().getConfig();
}

function getStorage() {
    if (!storage) {
        storage = createStorage(getS3(), getConfig().storage.s3.bucket);
    }
    return storage;
}

function getProvider() {
    if (!provider) {
        var key = jsonfile.readFileSync(getConfig().provider.key);
        provider = createProvider(google, key);
    }
    return provider;
}

function getBackupper() {
    if (!backupper) {
        backupper = createBackupper(getProvider(), ytdl, getStorage());
    }
    return backupper;
}

module.exports = {
    getBackupper: getBackupper,
    getProvider: getProvider,
    getStorage: getStorage
};
