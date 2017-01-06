var VError = require('verror');

module.exports = function (config, storageManager) {
    const CONFIG_BACKUPPER_STORAGE = 'backupper.storage';

    var storage;

    function getBackupperStorage() {
        if (!storage) {
            try {
                storage = storageManager.getStorage(config.get(CONFIG_BACKUPPER_STORAGE));
            } catch (err) {
                throw createError(err);
            }
        }
        return storage;
    }

    function createError(err) {
        throw new VError(err, 'Unable to get backupper storage');
    }

    return {
        getBackupperStorage: getBackupperStorage
    };
};
