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

module.exports = {
    getTmpDir,
    removeTmpDir
};
