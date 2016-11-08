var url = require('url');
var _ = require('lodash');
var VError = require('verror');

module.exports = function (ytdl, storage, displayOutput) {
    /**
     * Handle a queue job
     * @param {Object} job BeeQueue job object
     * @returns {Promise}
     */
    function handle(job) {
        return Promise.resolve()
            .then(function () {
                var jobData = getValidatedJobData(job);
                return backup(jobData.playlistId, jobData.videoId);
            })
            .catch(function (err) {
                return Promise.reject(createError(job, err));
            });
    }

    /**
     * Backup one specific video (download and save)
     *
     * @param {string} playlistId Playlist to which the video belongs
     * @param {string} videoId
     * @returns {Promise}
     */
    function backup(playlistId, videoId) {
        return new Promise(function (resolve, reject) {
            try {
                var url = buildVideoUrl(videoId);
                var stream = ytdl(url);
            } catch (err) {
                return reject(createError(videoId, err));
            }

            return storage.save(stream, playlistId, videoId)
                .then(function () {
                    displayOutput.outputLine('Saved video ' + videoId);
                    return resolve();
                })
                .catch(function (err) {
                    return reject(createError(videoId, err));
                });
        });
    }

    /**
     * @param {Object} job
     * @returns {Object}
     */
    function getValidatedJobData(job) {
        validateProperties(job, ['data']);
        validateProperties(job.data, ['videoId', 'playlistId']);
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
     * @param {string} videoId
     * @returns {string}
     */
    function buildVideoUrl(videoId) {
        return url.format({
            protocol: 'https',
            host: 'www.youtube.com',
            pathname: 'watch',
            query: { v: videoId }
        });
    }

    /**
     * @param {Object} job
     * @param {Error} err
     * @returns {Error}
     */
    function createError(job, err) {
        var error = new VError(err, 'Unable to handle job %s', JSON.stringify(job));
        displayOutput.outputLine(error.message);
        return error;
    }

    return {
        handle: handle
    };
};
