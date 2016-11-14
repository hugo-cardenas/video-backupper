var redis = require('redis');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');

/**
 * @returns {Promise}
 */
function flushDb() {
    return new Promise(function (resolve, reject) {
        getRedisClient().flushdb(function () {
            // If there is an error, assume it was already flushed
            return resolve();
        });
    });
}

/**
 * @returns {Promise}
 */
function quit() {
    return new Promise(function (resolve, reject) {
        getRedisClient().quit(function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

var redisClient;

/**
 * @returns {Object}
 */
function getRedisClient() {
    if (!redisClient) {
        redisClient = redis.createClient(
            getConfigValue('queue.redis')
        );
    }
    return redisClient;
}

/**
 * @param {string} key
 * @returns {string|number|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

module.exports = {
    flushDb: flushDb,
    quit: quit
};
