/**
 * @typedef {Object} Provider
 *
 * @property {function} getVideoItems Get a list of video items
 */

/**
 * Create provider
 *
 * @param {Object} google Google API client object
 * @param {Object} config Project config
 * @returns {Provider}
 */
module.exports = function (google, config) {
    /**
     * @returns {Object} JWT client
     */
    function createJwtClient() {
        return new google.auth.JWT(
            config.email,
            config.keyFile,
            null,
            ['https://www.googleapis.com/auth/youtube.readonly'],
            null
        );
    }

    /**
     * @returns {Promise<Object>} Promise resolving with authenticated JWT client
     */
    function createAuthorizedJwtClient() {
        return new Promise(function (resolve, reject) {
            var jwtClient = createJwtClient();
            jwtClient.authorize(function (err, tokens) {
                if (err) {
                    return reject(err);
                }
                return resolve(jwtClient);
            });
        });
    }

    /**
     * Extract all video items from the API response
     *
     * @param {Object} responseData
     * @returns {Object[]} Array of video items
     */
    function extractVideoItems(responseData) {
        // TODO Validate response, ensure that videoId is found inside
        return responseData.items.map(function (elem) {
            return elem.snippet;
        });
    }

    /**
     * Get all video items from the specified playlist
     *
     * @param {Object} jwtClient
     * @param {string} playlistId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getItems(jwtClient, playlistId) {
        return new Promise(function (resolve, reject) {
            var youtube = google.youtube({
                version: 'v3',
                auth: jwtClient
            });

            var options = {
                playlistId: playlistId,
                part: ['snippet'],
                maxResults: 50
            };

            youtube.playlistItems.list(options, {}, function (err, data, response) {
                if (err) {
                    return reject(err);
                }
                return resolve(extractVideoItems(data));
            });
        });
    }

    /**
     * Get video items from the specified playlist
     *
     * @param {string} playlistId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getVideoItems(playlistId) {
        return createAuthorizedJwtClient()
            .then(function (jwtClient) {
                return getItems(jwtClient, playlistId);
            });
    }

    return {
        getVideoItems: getVideoItems
    };
};
