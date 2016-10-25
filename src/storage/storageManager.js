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

var VError = require('verror');
var baserequire = require('base-require');
var createS3Storage = baserequire('src/storage/s3Storage');
var createDropboxStorage = baserequire('src/storage/dropboxStorage');

/**
 * @param {Config} config Config object
 * @param {function} createS3Storage S3 storage factory
 * @param {function} createDropboxStorage Dropbox storage factory
 * @returns {StorageManager}
 */
module.exports = function (config, s3, Dropbox) {
    const CONFIG_S3 = 'storage.s3';

    var dropbox;
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
            case 'dropbox':
                return createDropboxStorage(getDropbox());
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
            var token = getConfigValue('dropbox', 'storage.dropbox.token');
            var config = { accessToken: token };
            dropbox = new Dropbox(config);
        }
        return dropbox;
    }

    return {
        getStorage: getStorage
    };
};
