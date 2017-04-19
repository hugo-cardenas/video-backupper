const test = require('blue-tape');
const crypto = require('crypto');
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

test('provider - getItems - succeeds', function (t) {
    var playlistId = 'playlistId40';
    var playlistName = 'playlistName40';

    var videoId1 = 'videoId42';
    var videoName1 = 'videoName42';

    var videoId2 = 'videoId44';
    var videoName2 = 'videoName44';

    var playlistsResponseData = createPlaylistResponseData(playlistId, playlistName);

    var playlistItemsResponseData = createPlaylistItemsResponseData([{
        videoId: videoId1,
        videoName: videoName1,
        playlistId: playlistId
    }, {
        videoId: videoId2,
        videoName: videoName2,
        playlistId: playlistId
    }]);

    var expectedVideoItem1 = {
        id: sha256(videoId1 + '_' + playlistName),
        name: videoName1,
        playlistName: playlistName,
        url: 'https://www.youtube.com/watch?v=' + videoId1
    };
    var expectedVideoItem2 = {
        id: sha256(videoId2 + '_' + playlistName),
        name: videoName2,
        playlistName: playlistName,
        url: 'https://www.youtube.com/watch?v=' + videoId2
    };
    var expectedVideoItems = [expectedVideoItem1, expectedVideoItem2];

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var expectedPlaylistOptions = {
        id: playlistId,
        part: ['snippet'],
        maxResults: 1
    };
    var expectedPlaylistItemsOptions = {
        playlistId: playlistId,
        part: ['snippet'],
        maxResults: 50
    };

    var youtube = {
        playlists: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistOptions, options);
                var err = null;
                var response = [];
                callback(err, playlistsResponseData, response);
            }
        },
        playlistItems: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistItemsOptions, options);
                var err = null;
                var response = [];
                callback(err, playlistItemsResponseData, response);
            }
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

    return provider.getVideoItems(playlistId)
        .then(function (items) {
            t.deepEqual(items, expectedVideoItems);
        });
});

test('provider - getItems - authorization error', function (t) {
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

    return provider.getVideoItems(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
        });
});

test('provider - getItems - playlists resource error', function (t) {
    var playlistId = 'playlistId40';

    var videoId1 = 'videoId42';
    var videoName1 = 'videoName42';

    var videoId2 = 'videoId44';
    var videoName2 = 'videoName44';

    var playlistItemsResponseData = createPlaylistItemsResponseData([{
        videoId: videoId1,
        videoName: videoName1,
        playlistId: playlistId
    }, {
        videoId: videoId2,
        videoName: videoName2,
        playlistId: playlistId
    }]);

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var expectedPlaylistOptions = {
        id: playlistId,
        part: ['snippet'],
        maxResults: 1
    };
    var expectedPlaylistItemsOptions = {
        playlistId: playlistId,
        part: ['snippet'],
        maxResults: 50
    };

    var errorMessage = 'Client has failed to request playlists resource';
    var youtube = {
        playlists: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistOptions, options);
                var err = new Error(errorMessage);
                var response = [];
                callback(err, {}, response);
            }
        },
        playlistItems: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistItemsOptions, options);
                var err = null;
                var response = [];
                callback(err, playlistItemsResponseData, response);
            }
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

    return provider.getVideoItems(playlistId)
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

        var playlistItemsResponseData = createPlaylistItemsResponseData([{
            videoId: videoId1,
            videoName: videoName1,
            playlistId: playlistId
        }, {
            videoId: videoId2,
            videoName: videoName2,
            playlistId: playlistId
        }]);

        var config = {
            email: 'foo@bar.com',
            keyFile: '/path/to/private/key.pem'
        };

        var jwtClient = createJwtClient(null);

        var expectedPlaylistOptions = {
            id: playlistId,
            part: ['snippet'],
            maxResults: 1
        };
        var expectedPlaylistItemsOptions = {
            playlistId: playlistId,
            part: ['snippet'],
            maxResults: 50
        };

        var youtube = {
            playlists: {
                list: function (options, params, callback) {
                    t.deepEqual(expectedPlaylistOptions, options);
                    var err = null;
                    var response = [];
                    callback(err, playlistsResponseData, response);
                }
            },
            playlistItems: {
                list: function (options, params, callback) {
                    t.deepEqual(expectedPlaylistItemsOptions, options);
                    var err = null;
                    var response = [];
                    callback(err, playlistItemsResponseData, response);
                }
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

        return provider.getVideoItems(playlistId)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(playlistId));
                t.ok(err.message.includes(JSON.stringify(playlistsResponseData)));
            });
    });
});

test('provider - getItems - playlistItems resource error', function (t) {
    var playlistId = 'playlistId40';
    var playlistName = 'playlistName40';

    var playlistResponseData = createPlaylistResponseData(playlistId, playlistName);

    var config = {
        email: 'foo@bar.com',
        keyFile: '/path/to/private/key.pem'
    };

    var jwtClient = createJwtClient(null);

    var expectedPlaylistOptions = {
        id: playlistId,
        part: ['snippet'],
        maxResults: 1
    };
    var expectedPlaylistItemsOptions = {
        playlistId: playlistId,
        part: ['snippet'],
        maxResults: 50
    };

    var errorMessage = 'Client has failed to request playlistItems resource';
    var youtube = {
        playlists: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistOptions, options);
                var err = null;
                var response = [];
                callback(err, playlistResponseData, response);
            }
        },
        playlistItems: {
            list: function (options, params, callback) {
                t.deepEqual(expectedPlaylistItemsOptions, options);
                var err = new Error(errorMessage);
                var response = [];
                callback(err, {}, response);
            }
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

    return provider.getVideoItems(playlistId)
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

        var playlistsResponseData = createPlaylistResponseData(playlistId, playlistName);

        var config = {
            email: 'foo@bar.com',
            keyFile: '/path/to/private/key.pem'
        };

        var jwtClient = createJwtClient(null);

        var expectedPlaylistOptions = {
            id: playlistId,
            part: ['snippet'],
            maxResults: 1
        };
        var expectedPlaylistItemsOptions = {
            playlistId: playlistId,
            part: ['snippet'],
            maxResults: 50
        };

        var youtube = {
            playlists: {
                list: function (options, params, callback) {
                    t.deepEqual(expectedPlaylistOptions, options);
                    var err = null;
                    var response = [];
                    callback(err, playlistsResponseData, response);
                }
            },
            playlistItems: {
                list: function (options, params, callback) {
                    t.deepEqual(expectedPlaylistItemsOptions, options);
                    var err = null;
                    var response = [];
                    callback(err, playlistItemsResponseData, response);
                }
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

        return provider.getVideoItems(playlistId)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(playlistId));
                t.ok(err.message.includes(JSON.stringify(playlistItemsResponseData)));
            });
    });
});

/**
 * @param {string} playlistId
 * @param {string} playlistName
 * @returns {Object}
 */
function createPlaylistResponseData(playlistId, playlistName) {
    return {
        kind: 'kind',
        etag: 'etag',
        pageInfo: {
            totalResults: 1,
            resultsPerPage: 1
        },
        items: [{
            kind: 'youtube#playlist',
            etag: 'etag',
            id: playlistId,
            snippet: {
                publishedAt: '2016-10-06T16:12:58.000Z',
                channelId: 'channelId',
                title: playlistName,
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
                    title: playlistName,
                    description: ''
                }
            }
        }]
    };
}

/**
 * @param {Object[]} videos Array of objects with attributes [videoId, videoName, playlistId]
 * @returns {Object}
 */
function createPlaylistItemsResponseData(videos) {
    return {
        kind: 'kind',
        etag: 'etag',
        pageInfo: {
            totalResults: videos.length,
            resultsPerPage: 50
        },
        items: videos.map(function (video) {
            return {
                kind: 'youtube#playlistItem',
                etag: 'etag',
                id: 'itemId42',
                snippet: {
                    publishedAt: '2016-10-09T17:53:41.000Z',
                    channelId: 'channelId',
                    title: video.videoName,
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
                    playlistId: video.playlistId,
                    position: 0,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: video.videoId
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
