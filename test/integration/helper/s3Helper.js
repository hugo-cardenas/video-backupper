var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');

/**
 * @returns {Promise<string[]>} Promise resolving with list of string keys in the S3 bucket
 */
function listKeys() {
    var s3 = storageLocator.getS3();
    var params = {
        Bucket: getS3Bucket()
    };

    return new Promise(function (resolve, reject) {
        s3.listObjects(params, function (err, data) {
            if (err) {
                return reject(err);
            }
            resolve(data.Contents.map(function (item) {
                return item.Key;
            }));
        });
    });
}

/**
 * @returns {Promise} Promise resolving without arguments
 */
function deleteKeys(keys) {
    if (keys.length === 0) {
        return Promise.resolve();
    }
    var s3 = storageLocator.getS3();
    var params = {
        Bucket: getS3Bucket(),
        Delete: {
            Objects: keys.map(function (key) {
                return { Key: key };
            })
        }
    };

    return new Promise(function (resolve, reject) {
        s3.deleteObjects(params, function (err, data) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
}

/**
 * Delete all keys in the bucket
 */
function deleteAllKeys() {
    return listKeys()
        .then(function (keys) {
            var deleteKeyPromises = keys.map(function (key) {
                return deleteKeys([key]);
            });
            return Promise.all(deleteKeyPromises);
        })
        // Verify that the bucket is empty after cleaning
        .then(function () {
            return listKeys();
        })
        .then(function (keys) {
            if (keys.length > 0) {
                var error = new Error('Failed to delete all keys, remaining: ' + keys.join(', '));
                return Promise.reject(error);
            }
        });
}

/**
 * @returns {string}
 */
function getS3Bucket() {
    return getConfigValue('storage.s3.bucket');
}

/**
 * @param {string} key
 * @returns {string|number|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

module.exports = {
    deleteAllKeys: deleteAllKeys,
    listKeys: listKeys
};
