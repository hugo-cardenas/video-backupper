var _ = require('lodash');
var VError = require('verror');

/**
 * @typedef {Object} Provider
 *
 * @property {function} getVideoItems Get a list of video items
 */

/**
 * Create provider
 *
 * @param {Object} google Google API client object
 * @param {Object} config Plain config object
 * @returns {Provider}
 */
module.exports = function (google, config) {
    validateConfig();

    var jwtClient;
    var youtubeClient;

    /**
     * @throws {Error
     */
    function validateConfig() {
        var keys = ['email', 'keyFile'];
        var missingKeys = _.difference(keys, Object.keys(config));
        if (missingKeys.length > 0) {
            throw new Error('Invalid config. Missing keys: ' + missingKeys.join(','));
        }
    }
    /**
     * @returns {Object} JWT client
     */
    function createJwtClient() {
        return new google.auth.JWT(
            config.email,
            config.keyFile,
            null, ['https://www.googleapis.com/auth/youtube.readonly'],
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
     * @returns {Promise<Object>} Resolves with authenticated JWT client
     */
    function getJwtClient() {
        if (jwtClient) {
            return Promise.resolve(jwtClient);
        }
        return createAuthorizedJwtClient()
            .then(function (client) {
                jwtClient = client;
                return jwtClient;
            });
    }

    /**
     * @returns {Promise<Object>} Resolves with Youtube client object
     */
    function getYoutubeClient() {
        if (youtubeClient) {
            return Promise.resolve(youtubeClient);
        }
        return getJwtClient()
            .then(function (jwtClient) {
                youtubeClient = google.youtube({
                    version: 'v3',
                    auth: jwtClient
                });
                return youtubeClient;
            });
    }

    /**
     * Get all video items from the specified playlist
     *
     * @param {Object} jwtClient
     * @param {string} playlistId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getItems(playlistId) {
        return getYoutubeClient()
            .then(function (youtubeClient) {
                var options = {
                    playlistId: playlistId,
                    part: ['snippet'],
                    maxResults: 5
                };
                return listPlaylistItems(youtubeClient, options);
            })
            .then(function (data) {
                return extractVideoItems(data);
            });
    }

    /**
     * Promisified wrapper for Youtube playlistItems resource
     *
     * @param {Object} youtubeClient
     * @param {Object} options
     * @returns {Promise<Object>} Resolves with response data
     */
    function listPlaylistItems(youtubeClient, options) {
        return new Promise(function (resolve, reject) {
            youtubeClient.playlistItems.list(options, {}, function (err, data, response) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
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
        try {
            return responseData.items.map(function (elem) {
                var videoId = elem.snippet.resourceId.videoId;
                var videoName = elem.snippet.title;
                var playlistId = elem.snippet.playlistId;
                if (videoId === undefined || videoName === undefined || playlistId === undefined) {
                    throw new Error();
                }
                return {
                    videoId: videoId,
                    videoName: videoName,
                    playlistId: playlistId
                };
            });
        } catch (err) {
            throw new VError('Invalid playlistItems resource response data %s', JSON.stringify(responseData));
        }
    }

    /**
     * Get playlist name for the specified playlist id
     *
     * @param {Object} jwtClient
     * @param {string} playlistId
     * @returns {Promise<string>} Resolves with playlist name
     */
    function getPlaylistName(playlistId) {
        return getYoutubeClient()
            .then(function (youtubeClient) {
                var options = {
                    id: playlistId,
                    part: ['snippet'],
                    maxResults: 1
                };
                return listPlaylists(youtubeClient, options);
            })
            .then(function (data) {
                return extractPlaylistName(data);
            });
    }

    /**
     * Promisified wrapper for Youtube playlists resource
     *
     * @param {Object} youtubeClient
     * @param {Object} options
     * @returns {Promise<string>}
     */
    function listPlaylists(youtubeClient, options) {
        return new Promise(function (resolve, reject) {
            youtubeClient.playlists.list(options, {}, function (err, data, response) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    /**
     * @param {Object} responseData
     * @returns {string}
     */
    function extractPlaylistName(responseData) {
        try {
            var name = responseData.items[0].snippet.title;
            if (name === undefined) {
                throw new Error();
            }
            return name;
        } catch (err) {
            throw new VError('Invalid playlists resource response data %s', JSON.stringify(responseData));
        }
    }

    /**
     * @param {Object[]} videoItems
     * @param {string} playlistName
     */
    function composeResult(videoItems, playlistName) {
        return videoItems.map(function (item) {
            item.playlistName = playlistName;
            return item;
        });
    }

    /**
     * @param {string} playlistId
     * @param {Error} err
     * @returns {Error}
     */
    function createError(playlistId, err) {
        return new VError(err, 'Unable to get video items for playlistId %s', playlistId);
    }

    /**
     * Get video items from the specified playlist
     *
     * @param {string} playlistId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getVideoItems(playlistId) {
        return Promise.all([
                getItems(playlistId),
                getPlaylistName(playlistId)
            ])
            .then(function (values) {
                var videoItems = values[0];
                var playlistName = values[1];
                return composeResult(videoItems, playlistName);
            })
            .catch(function (err) {
                throw createError(playlistId, err);
            });
    }

    return {
        getVideoItems: getVideoItems
    };
};
