/**
 * @typedef {Object} StorageManager
 *
 * @property {function} getStorage Get a storage by name
 */

/**
 * @typedef {Object} StorageInterface
 *
 * @property {function} save Save a stream for a playlistId, videoId
 */

/**
 * @param {Config} config Config object
 * @param {function} createS3Storage S3 storage factory
 * @param {function} createDropboxStorage Dropbox storage factory
 * @returns {StorageManager}
 */
module.exports = function (config, createS3Storage, s3, createDropboxStorage, dropbox) {
    const CONFIG_S3 = 'storage.s3';
    const CONFIG_DROPBOX = 'storage.dropbox';

    var storages = {};

    /**
     * Get storage by name. Created storages are cached in the manager object
     *
     * @param {string} name
     * @returns {StorageInterface}
     * @throws {Error} If name is invalid
     */
    function getStorage(name) {
        if (!storages[name]) {
            storages[name] = createStorage(name);
        }
        return storages[name];
    }

    /**
     * Create storage by name
     *
     * @param {string} name
     * @returns {StorageInterface}
     * @throws {Error} If name is invalid
     */
    function createStorage(name) {
        switch (name) {
            case 's3':
                return createS3Storage(s3, getConfigValue(name, CONFIG_S3));
            default:
                throw new Error('Invalid storage name: "' + name + '"');
        }
    }

    /**
     * @param {string} key
     * @returns {Object|string|number} Config value
     * @throws {Error} If config key not found
     */
    function getConfigValue(name, key) {
        try {
            return config.get(key);
        } catch (err) {
            throw new Error('Invalid config for storage "' + name + '": ' + err.message);
        }
    }

    return {
        getStorage: getStorage
    };
};
