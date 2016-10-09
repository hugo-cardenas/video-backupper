var aws = require('aws-sdk');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var createStorage = baserequire('src/storage/storage');

var s3;
var storage;

/**
 * @returns {S3} S3 client object
 */
function getS3() {
    if (!s3) {
        s3 = new aws.S3();
    }
    return s3;
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
    if (!storage) {
        storage = createStorage(getS3(), getBucket());
    }
    return storage;
}

module.exports = {
    getStorage: getStorage
};
