var aws = require('aws-sdk');
var google = require('googleapis');
var ytdl = require('ytdl-core');

var createBackupper = require('./backupper');
var createProvider = require('./provider');
var createStorage = require('./storage');
var createDisplayOutput = require('./displayOutput');
var createConfigManager = require('./config/configManager');

var s3;

var backupper;
var provider;
var storage;
var displayOutput;
var configManager;

/**
 * @returns {S3}
 */
function getS3() {
    if (!s3) {
        s3 = new aws.S3();
    }
    return s3;
}

/**
 * @returns {ConfigManager}
 */
function getConfigManager() {
    if (!configManager) {
        configManager = createConfigManager();
    }
    return configManager;
}

/**
 * @returns {Object}
 */
function getConfig() {
    return getConfigManager().getConfig();
}

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    if (!displayOutput) {
        displayOutput = createDisplayOutput();
    }
    return displayOutput;
}

/**
 * @returns {Storage}
 */
function getStorage() {
    if (!storage) {
        storage = createStorage(getS3(), getConfig().storage.s3.bucket);
    }
    return storage;
}

/**
 * @returns {Provider}
 */
function getProvider() {
    if (!provider) {
        provider = createProvider(google, getConfig().provider.youtube);
    }
    return provider;
}

/**
 * @returns {Backupper}
 */
function getBackupper() {
    if (!backupper) {
        backupper = createBackupper(getProvider(), ytdl, getStorage(), getDisplayOutput());
    }
    return backupper;
}

module.exports = {
    getBackupper: getBackupper,
    getProvider: getProvider,
    getStorage: getStorage
};
