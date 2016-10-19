var test = require('blue-tape');
var baserequire = require('base-require');
var backupperLocator = baserequire('src/backupper/backupperLocator');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');

// TODO Fix
test.skip('backupper - run - succeeds', function (t) {
    var playlistId = 'PLWcOakfYWxVM_wvoM_bKxEiuGwvgYCvOE';
    var videoId1 = 'egjumMGKZCg';
    var videoId2 = '40T4IrLiCiU';

    var displayOutput = {
        outputLine: function () {}
    };
    backupperLocator.setDisplayOutput(displayOutput);
    var backupper = backupperLocator.getBackupperManager().getBackupper();

    listS3Keys()
        .then(deleteS3Keys)
        .then(listS3Keys)
        .then(function (s3Keys) {
            t.equal(s3Keys.length, 0);
            return Promise.resolve();
        })
        .then(backupper.run.bind(backupper, playlistId))
        .then(function (errors) {
            t.equal(errors.length, 0);
            if (errors[0]) {
                t.end(errors[0]);
            }
            return Promise.resolve();
        })
        .then(listS3Keys)
        .then(function (s3Keys) {
            t.equal(s3Keys.length, 2);
            t.ok(s3Keys.includes(playlistId + '/' + videoId1 + '.mp4'));
            t.ok(s3Keys.includes(playlistId + '/' + videoId2 + '.mp4'));
            t.end();
        })
        .catch(function (err) {
            console.log(err);
            t.end(err);
        });
});

/**
 * @returns {Promise<string[]>} Promise resolving with list of string keys in the S3 bucket
 */
function listS3Keys() {
    var s3 = storageLocator.getS3();
    var params = {
        Bucket: getS3Bucket()
    };

    return new Promise(function (resolve, reject) {
        s3.listObjects(params, function (err, data) {
            if (err) {
                reject(err);
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
function deleteS3Keys(keys) {
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
                reject(err);
            }
            resolve(data);
        });
    });
}

/**
 * @returns {string}
 */
function getS3Bucket() {
    return configLocator.getConfigManager().getConfig().get('storage.s3.bucket');
}
