var aws = require('aws-sdk');
var google = require('googleapis');
var ytdl = require('ytdl-core');

// TODO Make this robust on missing keys
var config = require('./config.json');
var providerConfig = config.provider;
var storageConfig = config.storage;

var createBackupper = require('./backupper');
var createProvider = require('./provider');
var createStorage = require('./storage');

var jsonFile = require('jsonfile');

var s3;

var backupper;
var provider;
var storage;

function getS3() {
    if (!s3) {
        s3 = new aws.S3();
    }
    return s3;
}

function getStorage() {
    if (!storage) {
        storage = createStorage(getS3(), storageConfig.bucket);
    }
    return storage;
}

function getProvider() {
    if (!provider) {
        var key = jsonFile.readFileSync(providerConfig.key);
        provider = createProvider(google, key);
    }
    return provider;
}

function getBackupper(){
    if (!backupper){
        backupper = createBackupper(getProvider(), ytdl, getStorage());
    }
    return backupper;
}

module.exports = {
    getBackupper: getBackupper,
    getProvider: getProvider,
    getStorage: getStorage
}