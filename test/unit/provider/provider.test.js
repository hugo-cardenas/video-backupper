const test = require('blue-tape');
const crypto = require('crypto');
const sinon = require('sinon');
const baserequire = require('base-require');
const createProvider = baserequire('src/provider/provider');

test('provider - create - invalid config', function (t) {
    var google = {};
    var config = {};
    try {
        createProvider(google, config);
        t.fail('Should throw error for invalid config');
    } catch (err) {
        t.ok(err.message.includes('Invalid config'));
        t.ok(err.message.includes('email'));
        t.ok(err.message.includes('keyFile'));
        t.end();
    }
});

test('provider - getPlaylistVideoItems - succeeds', function (t) {
    var playlistId = 'playlistId40';
    var playlistName = 'playlistName40';

    var videoId1 = 'videoId42';
    var videoName1 = 'videoName42';

    var videoId2 = 'videoId44';
    var videoName2 = 'videoName44';

    var playlistsResponseData = createPlaylistsResponseData([{ id: playlistId, name: playlistName }]);

    var playlistItemsResponseData = createPlaylistItemsResponseData(playlistId, [{
        id: videoId1,
        name: videoName1
    }, {
        id: videoId2,
        name: videoName2
    }]);

    var expectedVideoItem1 = createProviderVideoItem(videoId1, videoName1, playlistName);
    var expectedVideoItem2 = createProviderVideoItem(videoId2, videoName2, playlistName);
    var expectedVideoItems = [expectedVideoItem1, expectedVideoItem2];

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var err = null;
    var youtube = {
        playlists: {
            list: createApiPlaylistsByIdFunction(t, playlistId, err, playlistsResponseData)
        },
        playlistItems: {
            list: createApiPlaylistItemsFunction(t, playlistId, err, playlistItemsResponseData)
        }
    };

    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        },
        youtube: function (options) {
            t.equal(options.version, 'v3');
            t.deepEqual(options.auth, jwtClient);
            return youtube;
        }
    };

    var provider = createProvider(google, config);

    return provider.getPlaylistVideoItems(playlistId)
        .then(function (items) {
            t.deepEqual(items, expectedVideoItems);
        });
});

test('provider - getPlaylistVideoItems - authorization error', function (t) {
    var playlistId = 'playlistId42';

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var errorMessage = 'Jwt client authorization has failed';
    var jwtClient = createJwtClient(new Error(errorMessage));

    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        }
    };

    var provider = createProvider(google, config);

    return provider.getPlaylistVideoItems(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
        });
});

test('provider - getPlaylistVideoItems - playlists resource error', function (t) {
    var playlistId = 'playlistId40';

    var videoId1 = 'videoId42';
    var videoName1 = 'videoName42';

    var videoId2 = 'videoId44';
    var videoName2 = 'videoName44';

    var playlistItemsResponseData = createPlaylistItemsResponseData(playlistId, [{
        id: videoId1,
        name: videoName1
    }, {
        id: videoId2,
        name: videoName2
    }]);

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var errorMessage = 'Client has failed to request playlists resource';
    var youtube = {
        playlists: {
            list: createApiPlaylistsByIdFunction(t, playlistId, new Error(errorMessage), {})
        },
        playlistItems: {
            list: createApiPlaylistItemsFunction(t, playlistId, null, playlistItemsResponseData)
        }
    };

    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        },
        youtube: function (options) {
            t.equal(options.version, 'v3');
            t.deepEqual(options.auth, jwtClient);
            return youtube;
        }
    };

    var provider = createProvider(google, config);

    return provider.getPlaylistVideoItems(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
        });
});

var playlistsResourceInvalidResponseData = [
    {},
    { items: 'foo' },
    { items: [] },
    { items: [{}] },
    {
        items: [{ snippet: {} }]
    }
];

playlistsResourceInvalidResponseData.forEach(function (playlistsResponseData, index) {
    test('provider - getItems - playlists resource invalid response format #' + index, function (t) {
        var playlistId = 'playlistId40';

        var videoId1 = 'videoId42';
        var videoName1 = 'videoName42';

        var videoId2 = 'videoId44';
        var videoName2 = 'videoName44';

        var playlistItemsResponseData = createPlaylistItemsResponseData(playlistId, [{
            id: videoId1,
            name: videoName1
        }, {
            id: videoId2,
            name: videoName2
        }]);

        var config = {
            email: 'foo@bar.com',
            keyFile: '/path/to/private/key.pem'
        };

        var jwtClient = createJwtClient(null);

        var err = null;
        var youtube = {
            playlists: {
                list: createApiPlaylistsByIdFunction(t, playlistId, err, playlistsResponseData)
            },
            playlistItems: {
                list: createApiPlaylistItemsFunction(t, playlistId, err, playlistItemsResponseData)
            }
        };

        var google = {
            auth: {
                JWT: function () {
                    return jwtClient;
                }
            },
            youtube: function (options) {
                t.equal(options.version, 'v3');
                t.deepEqual(options.auth, jwtClient);
                return youtube;
            }
        };

        var provider = createProvider(google, config);

        return provider.getPlaylistVideoItems(playlistId)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(playlistId));
                t.ok(err.message.includes(JSON.stringify(playlistsResponseData)));
            });
    });
});

test('provider - getPlaylistVideoItems - playlistItems resource error', function (t) {
    var playlistId = 'playlistId40';
    var playlistName = 'playlistName40';

    var playlistsResponseData = createPlaylistsResponseData([{ id: playlistId, name: playlistName }]);

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var errorMessage = 'Client has failed to request playlistItems resource';
    var youtube = {
        playlists: {
            list: createApiPlaylistsByIdFunction(t, playlistId, null, playlistsResponseData)
        },
        playlistItems: {
            list: createApiPlaylistItemsFunction(t, playlistId, new Error(errorMessage), {})
        }
    };

    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        },
        youtube: function (options) {
            t.equal(options.version, 'v3');
            t.deepEqual(options.auth, jwtClient);
            return youtube;
        }
    };

    var provider = createProvider(google, config);

    return provider.getPlaylistVideoItems(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
        });
});

var playlistItemsResourceInvalidResponseData = [
    {},
    { items: 'foo' },
    { items: [{}] },
    {
        items: [{ snippet: {} }]
    },

    {
        items: [{
            snippet: {
                // title: 'title',
                playlistId: 'playlistId',
                resourceId: {
                    videoId: 'videoId'
                }
            }
        }]
    },
    {
        items: [{
            snippet: {
                title: 'title',
                // playlistId: 'playlistId',
                resourceId: {
                    videoId: 'videoId'
                }
            }
        }]
    },
    {
        items: [{
            snippet: {
                title: 'title',
                playlistId: 'playlistId'
                // resourceId: {
                //     videoId: 'videoId'
                // }
            }
        }]
    }
];

playlistItemsResourceInvalidResponseData.forEach(function (playlistItemsResponseData, index) {
    test('provider - getItems - playlistItems resource invalid response format #' + index, function (t) {
        var playlistId = 'playlistId40';
        var playlistName = 'playlistName40';

        var playlistsResponseData = createPlaylistsResponseData([{ id: playlistId, name: playlistName }]);

        var config = {
            email: 'foo@bar.com',
            keyFile: '/path/to/private/key.pem'
        };

        var jwtClient = createJwtClient(null);

        var err = null;
        var youtube = {
            playlists: {
                list: createApiPlaylistsByIdFunction(t, playlistId, err, playlistsResponseData)
            },
            playlistItems: {
                list: createApiPlaylistItemsFunction(t, playlistId, err, playlistItemsResponseData)
            }
        };

        var google = {
            auth: {
                JWT: function () {
                    return jwtClient;
                }
            },
            youtube: function (options) {
                t.equal(options.version, 'v3');
                t.deepEqual(options.auth, jwtClient);
                return youtube;
            }
        };

        var provider = createProvider(google, config);

        return provider.getPlaylistVideoItems(playlistId)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(playlistId));
                t.ok(err.message.includes(JSON.stringify(playlistItemsResponseData)));
            });
    });
});

test.skip('provider - getChannelVideoItems - succeeds', function (t) {
    var channelId = 'channelId';
    
    var playlistId1 = 'playlistId1';
    var playlistName1 = 'playlistName1';

    var playlistId2 = 'playlistId2';
    var playlistName2 = 'playlistName2';

    var videoId1 = 'videoId1';
    var videoName1 = 'videoName1';

    var videoId2 = 'videoId2';
    var videoName2 = 'videoName2';

    var videoId3 = 'videoId3';
    var videoName3 = 'videoName3';

    var playlistsResponseData = createPlaylistsResponseData([
        { id: playlistId1, name: playlistName1 },
        { id: playlistId2, name: playlistName2 }
    ]);

    var playlistItemsResponseData1 = createPlaylistItemsResponseData(
        playlistId1, [{ id: videoId1, name: videoName1 }]
    );
    var playlistItemsResponseData2 = createPlaylistItemsResponseData(
        playlistId2, [
            { id: videoId2, name: videoName2 },
            { id: videoId3, name: videoName3 }
        ]
    );

    var expectedVideoItems = [
        createProviderVideoItem(videoId1, videoName1, playlistName1),
        createProviderVideoItem(videoId2, videoName2, playlistName2),
        createProviderVideoItem(videoId3, videoName3, playlistName2)
    ];

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var err = null;
    var youtube = {
        playlists: {
            list: createApiPlaylistsByChannelIdFunction(t, channelId, err, playlistsResponseData)
        },
        playlistItems: {
            list: sinon.stub()
        }
    };

    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        },
        youtube: function (options) {
            t.equal(options.version, 'v3');
            t.deepEqual(options.auth, jwtClient);
            return youtube;
        }
    };

    var provider = createProvider(google, config);

    return provider.getPlaylistVideoItems()
        .then(function (items) {
            t.deepEqual(items, expectedVideoItems);
        });
});

/**
 * @param {string} playlistId
 * @param {string} playlistName
 * @returns {Object}
 */
function createPlaylistsResponseData(playlists) {
    return {
        kind: 'kind',
        etag: 'etag',
        pageInfo: {
            totalResults: 1,
            resultsPerPage: 1
        },
        items: playlists.map(function (playlist) {
            return {
                kind: 'youtube#playlist',
                etag: 'etag',
                id: playlist.id,
                snippet: {
                    publishedAt: '2016-10-06T16:12:58.000Z',
                    channelId: 'channelId',
                    title: playlist.name,
                    description: '',
                    thumbnails: {
                        default: {
                            url: 'https://foo1.jpg',
                            width: 120,
                            height: 90
                        },
                        medium: {
                            url: 'https://foo2.jpg',
                            width: 320,
                            height: 180
                        },
                        high: {
                            url: 'https://foo3.jpg',
                            width: 480,
                            height: 360
                        }
                    },
                    channelTitle: 'channel title',
                    localized: {
                        title: playlist.name,
                        description: ''
                    }
                }
            };
        })
    };
}

/**
 * @param {string} playlistId
 * @param {Object[]} videos Array of objects with attributes [id, name]
 * @returns {Object}
 */
function createPlaylistItemsResponseData(playlistId, videoItems) {
    return {
        kind: 'kind',
        etag: 'etag',
        pageInfo: {
            totalResults: videoItems.length,
            resultsPerPage: 50
        },
        items: videoItems.map(function (videoItem) {
            return {
                kind: 'youtube#playlistItem',
                etag: 'etag',
                id: 'itemId42',
                snippet: {
                    publishedAt: '2016-10-09T17:53:41.000Z',
                    channelId: 'channelId',
                    title: videoItem.name,
                    description: '',
                    thumbnails: {
                        default: {
                            url: 'https://foo1.jpg',
                            width: 120,
                            height: 90
                        },
                        medium: {
                            url: 'https://foo2.jpg',
                            width: 320,
                            height: 180
                        },
                        high: {
                            url: 'https://foo3.jpg',
                            width: 480,
                            height: 360
                        }
                    },
                    channelTitle: 'channel title',
                    playlistId: playlistId,
                    position: 0,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: videoItem.id
                    }
                }
            };
        })
    };
}

/**
 * @param {Error|null} err
 * @returns {Object} JWT client object
 */
function createJwtClient(err) {
    return {
        authorize: function (callback) {
            var tokens = [];
            callback(err, tokens);
        }
    };
}

/**
 * @param {string} str
 * @returns {string}
 */
function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * @param {string} providerVideoId
 * @param {string} name
 * @param {string} playlistName
 * @returns {Object}
 */
function createProviderVideoItem(providerVideoId, name, playlistName) {
    return {
        id: sha256(providerVideoId + '_' + playlistName),
        name: name,
        playlistName: playlistName,
        url: 'https://www.youtube.com/watch?v=' + providerVideoId
    };
}

/**
 * Create function mock for playlists resource queried by playlistId
 *
 * @param {Object} t Test object
 * @param {string} playlistId
 * @param {Error|null} err
 * @param {Object} responseData
 * @returns {Object}
 */
function createApiPlaylistsByIdFunction(t, playlistId, err, responseData) {
    var expectedOptions = {
        id: playlistId,
        part: ['snippet'],
        maxResults: 1
    };
    return createApiFunctionMock(t, expectedOptions, err, responseData);
}

/**
 * Create function mock for playlists resource queried by channelId
 *
 * @param {Object} t Test object
 * @param {string} channelId
 * @param {Error|null} err
 * @param {Object} responseData
 * @returns {Object}
 */
function createApiPlaylistsByChannelIdFunction(t, channelId, err, responseData) {
    var expectedOptions = {
        channelId: channelId,
        part: ['snippet'],
        maxResults: 50
    };
    return createApiFunctionMock(t, expectedOptions, err, responseData);
}

/**
 * Create function mock for playlistItems resource queried by playlistId
 *
 * @param {Object} t Test object
 * @param {string} channelId
 * @param {Error|null} err
 * @param {Object} responseData
 * @returns {Object}
 */
function createApiPlaylistItemsFunction(t, playlistId, err, responseData) {
    var expectedOptions = {
        playlistId: playlistId,
        part: ['snippet'],
        maxResults: 50
    };
    return createApiFunctionMock(t, expectedOptions, err, responseData);
}

/**
 * @param {Object} t Test object
 * @param {Object} options Expected options object
 * @param {Error|null} err
 * @param {Object} responseData
 * @returns {Object}
 */
function createApiFunctionMock(t, expectedOptions, err, responseData) {
    return function (options, params, callback) {
        t.deepEqual(expectedOptions, options);
        var response = [];
        callback(err, responseData, response);
    };
}
