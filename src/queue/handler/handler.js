var _ = require('lodash');
var VError = require('verror');
var stringify = require('json-stringify-safe');

module.exports = function (ytdl, storage, displayOutput) {
    /**
     * Handle a queue job
     * @param {Object} job BeeQueue job object
     * @returns {Promise}
     */
    function handle(job) {
        return Promise.resolve()
            .then(function () {
                var videoItem = getValidatedVideoItem(job);
                return backup(videoItem);
            })
            .catch(function (err) {
                return Promise.reject(createError(job, err));
            });
    }

    /**
     * Backup one specific video (download and save)
     *
     * @param {Object} videoItem
     * @returns {Promise}
     */
    function backup(videoItem) {
        var videoId = videoItem.id;
        try {
            var stream = ytdl(videoItem.url);
        } catch (err) {
            return Promise.reject(createError(videoId, err));
        }

        return storage.save(stream, videoItem)
            .then(function () {
                displayOutput.outputLine('Saved video ' + videoId);
                return Promise.resolve();
            });
    }

    /**
     * @param {Object} job
     * @returns {Object}
     */
    function getValidatedVideoItem(job) {
        validateProperties(job, ['data']);
        validateProperties(job.data, ['id', 'url']);
        return job.data;
    }

    /**
     * Validate that object contains mandatory properties
     * @param {Object} object
     * @param {string[]} mandatoryProperties
     * @throws {Error} If object is missing any mandatory property
     */
    function validateProperties(object, mandatoryProperties) {
        var missingProperties = _.difference(mandatoryProperties, Object.keys(object));
        if (missingProperties.length > 0) {
            throw new Error('Missing properties [' + missingProperties.join(', ') + '] in object ' + JSON.stringify(object));
        }
    }

    /**
     * @param {Object} job
     * @param {Error} err
     * @returns {Error}
     */
    function createError(job, err) {
        var error = new VError(err, 'Unable to handle job %s', stringify(job));
        return error;
    }

    return {
        handle: handle
    };
};
