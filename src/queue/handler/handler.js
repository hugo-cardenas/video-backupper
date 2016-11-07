var url = require('url');
var VError = require('verror');

module.exports = function (ytdl, storage, displayOutput) {
    function handle(job) {
        job.data
    }

    function getVideoItem() {
        
    }

    function validateJobData(job) {

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
     * @param {Object} jobData
     * @param {Error} err
     * @returns {Error}
     */
    function createError(jobData, err) {
        var error = new VError(err, 'Unable to handle job %s', JSON.stringify(jobData));
        displayOutput.outputLine(error.message);
        return error;
    }

    return {
        handle: handle
    };
};
