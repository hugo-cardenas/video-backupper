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

const VError = require('verror');
const baserequire = require('base-require');
const createS3Storage = baserequire('src/storage/s3Storage');
const createDropboxStorage = baserequire('src/storage/dropboxStorage');
const createFileStorage = baserequire('src/storage/fileStorage');


/**
 * @param {Config} config Config object
 * @param {function} createS3Storage S3 storage factory
 * @param {function} createDropboxStorage Dropbox storage factory
 * @returns {StorageManager}
 */
module.exports = function (config, s3, Dropbox) {
    const CONFIG_S3 = 'storage.s3';
    const CONFIG_FILE_BASEDIR = 'storage.file.baseDir';

    let dropbox;
    const storages = {};

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
            case 'dropbox':
                return createDropboxStorage(getDropbox());
            case 'file':
                return createFileStorage(getConfigValue(name, CONFIG_FILE_BASEDIR));
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
            throw new VError(err, 'Invalid config for storage "' + name + '"');
        }
    }

    /**
     * @returns {Object} Dropbox client object
     */
    function getDropbox() {
        if (!dropbox) {
            const token = getConfigValue('dropbox', 'storage.dropbox.token');
            const config = { accessToken: token };
            dropbox = new Dropbox(config);
        }
        return dropbox;
    }

    return {
        getStorage: getStorage
    };
};
