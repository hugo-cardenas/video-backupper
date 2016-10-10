/**
 * @typedef {Object} Config
 *
 * @property get {function} Get a config element by key in the form foo.bar.baz
 *                          Use empty key for getting the whole config
 */

/**
 * @param {Object} configArray Config array
 * @returns {Config} Config object
 */
module.exports = function (configArray) {
    var separator = '.';

    /**
     * @param {string} key Key in the form foo.bar.baz
     * @returns {Object|string|number}
     * @throws {Error} Throws if the key is invalid
     */
    function get(key) {
        if (key === '') {
            return configArray;
        }
        try {
            return getRecursive(configArray, key.split(separator));
        } catch (err) {
            throw new Error('Config key not found: "' + key + '"');
        }
    }

    function getRecursive(configArray, keys) {
        var firstKey = keys.shift();
        if (typeof configArray !== 'object' || !configArray.hasOwnProperty(firstKey)) {
            throw new Error();
        }
        if (keys.length > 0) {
            return getRecursive(configArray[firstKey], keys);
        }
        return configArray[firstKey];
    }

    return {
        get: get
    };
};
