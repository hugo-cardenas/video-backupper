const _ = require('lodash');
const VError = require('verror');
var url = require('url');

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

    // Cache for storing API playlists by id
    var cachedPlaylists = {};

    /**
     * Get video items from the specified playlist
     *
     * @param {string} playlistId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getPlaylistVideoItems(playlistId) {
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
                throw createPlaylistError(playlistId, err);
            });
    }

    /**
     * Get video items from the specified channel
     *
     * @param {string} channelId
     * @returns {Promise<Object[]>} Promise resolving with an array of video items
     */
    function getChannelVideoItems(channelId) {
        return getChannelPlaylists(channelId)
            .then(function (playlists) {
                var promises = playlists.map(function (playlist) {
                    return getPlaylistVideoItems(playlist.id);
                });
                return Promise.all(promises);
            })
            .then(function (values) {
                return _.flatten(values);
            })
            .catch(function (err) {
                throw createChannelError(channelId, err);
            });
    }

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
                    maxResults: 50
                };
                return listPlaylistItems(youtubeClient, options);
            })
            .then(function (data) {
                return extractVideoItems(data);
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
     * @param {string} playlistId
     * @returns {Promise<string>} Resolves with playlist name
     */
    function getPlaylistName(playlistId) {
        if (cachedPlaylists[playlistId]) {
            return Promise.resolve(cachedPlaylists[playlistId].name);
        }

        return getAPIPlaylistsById(playlistId)
            .then(function (playlists) {
                if (playlists.length < 1) {
                    return Promise.reject(new VError('Playlist with id %s not found in API', playlistId));
                }
                return playlists;
            })
            .then(cachePlaylists)
            .then(function () {
                return cachedPlaylists[playlistId].name;
            });
    }

    /**
     * @param {Object[]} playlists
     */
    function cachePlaylists(playlists) {
        playlists.forEach(function (playlist) {
            cachedPlaylists[playlist.id] = playlist;
        });
    }

    /**
     * @param {string} channelId
     * @returns {Promise<Object[]>} Resolves with array of playlist objects {id, name}
     */
    function getChannelPlaylists(channelId) {
        return getAPIPlaylistsByChannelId(channelId)
            .then(function (playlists) {
                cachePlaylists(playlists);
                return playlists;
            });
    }

    /**
     * @param {string} id
     * @returns {Object[]} Array of playlist objects {id, name}
     */
    function getAPIPlaylistsById(id) {
        var options = {
            id: id,
            part: ['snippet'],
            maxResults: 1
        };
        return getAPIPlaylists(options);
    }

    /**
     * @param {string} channelId
     * @returns {Object[]} Array of playlist objects {id, name}
     */
    function getAPIPlaylistsByChannelId(channelId) {
        var options = {
            channelId: channelId,
            part: ['snippet'],
            maxResults: 50
        };
        return getAPIPlaylists(options);
    }

    /**
     * @param {Object} options API options
     * @returns {Object[]} Array of playlist objects {id, name}
     */
    function getAPIPlaylists(options) {
        return getYoutubeClient()
            .then(function (youtubeClient) {
                return listPlaylists(youtubeClient, options);
            })
            .then(function (data) {
                return buildPlaylistsFromResponseData(data);
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
     * @param {Object} data Playlists resource response data
     * @returns {Object[]} Array of playlist objects {id, name}
     */
    function buildPlaylistsFromResponseData(data) {
        try {
            return data.items.map(function (item) {
                if (!item.id || !item.snippet.title) {
                    throw new Error();
                }
                return {
                    id: item.id,
                    name: item.snippet.title
                };
            });
        } catch (err) {
            throw new VError('Invalid playlists resource response data %s', JSON.stringify(data));
        }
    }

    /**
     * @param {Object[]} videoItems
     * @param {string} playlistName
     */
    function composeResult(videoItems, playlistName) {
        return videoItems.map(function (item) {
            return buildVideoObject(item, playlistName);
        });
    }

    /**
     * @param {Object} item
     * @param {string} playlistName
     * @returns {Object}
     */
    function buildVideoObject(item, playlistName) {
        return {
            id: item.videoId,
            name: item.videoName,
            playlistName: playlistName,
            url: buildVideoUrl(item.videoId)
        };
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
     * @param {string} playlistId
     * @param {Error} err
     * @returns {Error}
     */
    function createPlaylistError(playlistId, err) {
        return new VError(err, 'Unable to get video items for playlist id %s', playlistId);
    }

    /**
     * @param {string} channelId
     * @param {Error} err
     * @returns {Error}
     */
    function createChannelError(channelId, err) {
        return new VError(err, 'Unable to get video items for channel id %s', channelId);
    }

    return {
        getPlaylistVideoItems: getPlaylistVideoItems,
        getChannelVideoItems: getChannelVideoItems
    };
};
