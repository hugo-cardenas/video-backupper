const tmp = require('tmp-promise');
const moment = require('moment');

let tmpDir;

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
        .then((dir) => {
            tmpDir = dir;
            return tmpDir;
        });
}

module.exports = {
    getTmpDir
};
