var aws = require('aws-sdk');
var Dropbox = require('dropbox');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createStorageManager = baserequire('src/storage/storageManager');

var _s3;
var _storageManager;

/**
 * @returns {Object} S3 client object
 */
function getS3() {
    if (!_s3) {
        _s3 = new aws.S3();
    }
    return _s3;
}

/**
 * @returns {Config} Config object
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {StorageManager}
 */
function getStorageManager() {
    if (!_storageManager) {
        _storageManager = createStorageManager(getConfig(), getS3(), Dropbox);
    }
    return _storageManager;
}

/**
 * @param {StorageManager} storageManager
 */
function setStorageManager(storageManager) {
    _storageManager = storageManager;
}

module.exports = {
    getS3: getS3,
    getStorageManager: getStorageManager,
    setStorageManager: setStorageManager
};
