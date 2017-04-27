const tmp = require('tmp-promise');
const moment = require('moment');

let tmpDir;
let tmpDirCleanupFunction;

/**
 * @returns {Promise<string>}
 */
function getTmpDir() {
    if (tmpDir) {
        return Promise.resolve(tmpDir);
    }

    const datetime = moment().format('YYYYMMDD_HHmmss_');
    const prefix = 'video_backupper_test_' + datetime;
    return tmp.dir({ prefix, unsafeCleanup: true })
        .then((result) => {
            tmpDir = result.path;
            tmpDirCleanupFunction = result.cleanup;
            return tmpDir;
        });
}

function removeTmpDir() {
    if (tmpDirCleanupFunction) {
        tmpDirCleanupFunction();
        tmpDir = null;
        tmpDirCleanupFunction = null;
    }
}

/**
 * Get buffer from stream
 * @param {Stream} stream
 * @returns {Promise<Buffer>}
 */
function getStreamBuffer(stream) {
    return new Promise(function (resolve, reject) {
        var chunks = [];
        stream.on('data', function (chunk) {
            chunks.push(chunk);
        });
        stream.on('error', function (err) {
            return reject(err);
        });
        stream.on('end', function () {
            return resolve(Buffer.concat(chunks));
        });
    });
}

module.exports = {
    getTmpDir,
    removeTmpDir,
    getStreamBuffer
};
