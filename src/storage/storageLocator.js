var aws = require('aws-sdk');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createStorage = baserequire('src/storage/storage');

var _s3;
var _storage;

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
 * @param {Object} s3 S3 client object
 */
function setS3(s3) {
    _s3 = s3;
}

/**
 * @returns {Config} Config object
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {string} S3 bucket name
 */
function getBucket() {
    return getConfig().storage.s3.bucket;
}

/**
 * @returns {Storage}
 */
function getStorage() {
    if (!_storage) {
        _storage = createStorage(getS3(), getBucket());
    }
    return _storage;
}

/**
 * @param {Storage} storage
 */
function setStorage(storage) {
    _storage = storage;
}

module.exports = {
    getS3: getS3,
    setS3: setS3,
    getStorage: getStorage,
    setStorage: setStorage
};
