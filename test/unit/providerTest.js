var test = require('blue-tape');
var createProvider = require('./../../src/provider');

test('provider - getItems - succeeds', function (t) {
    var playlistId = 'playlistId42';

    var item1 = { title: 'foo', resourceId: { kind: 'youtube#video', videoId: 'foo42' }};
    var item2 = { title: 'bar', resourceId: { kind: 'youtube#video', videoId: 'bar44' }};
    var responseData = createResponseData([item1, item2]);
    var expectedItems = [item1, item2];

    var key = {
        client_email: 'foo@bar.com',
        private_key: 'privateKeyFoo',
    };

    var jwtClient = {
        authorize: function (callback) {
            var err = null;
            var tokens = [];
            callback(err, tokens);
        }
    };

    var youtube = {
        playlistItems: {
            list: function (options, params, callback) {
                t.equal(options.playlistId, playlistId);
                t.deepEqual(options.part, ['snippet']);
                t.equal(options.maxResults, 50);

                var err = null;
                var response = [];
                callback(err, responseData, response);
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

    var provider = createProvider(google, key);

    return provider.getVideoItems(playlistId)
        .then(function (items) {
            t.deepEqual(items, expectedItems);
            return Promise.resolve();
        });
});


test('provider - getItems - authorization error', function (t) {
    var playlistId = 'playlistId42';

    var key = {
        client_email: 'foo@bar.com',
        private_key: 'privateKeyFoo',
    };

    var errorMessage = 'jwtClientError';
    var jwtClient = {
        authorize: function (callback) {
            var err = new Error(errorMessage);
            var tokens = [];
            callback(err, tokens);
        }
    };

    var youtube = {}
    var google = {
        auth: {
            JWT: function () {
                return jwtClient;
            }
        }
    };

    var provider = createProvider(google, key);

    return provider.getVideoItems(playlistId)
        .catch(function (err) {
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});

test('provider - getItems - list error', function (t) {
    var playlistId = 'playlistId42';

    var item1 = { title: 'foo', resourceId: { kind: 'youtube#video', videoId: 'foo42' }};
    var item2 = { title: 'bar', resourceId: { kind: 'youtube#video', videoId: 'bar44' }};
    var responseData = createResponseData([item1, item2]);
    var expectedItems = [item1, item2];

    var key = {
        client_email: 'foo@bar.com',
        private_key: 'privateKeyFoo',
    };

    var jwtClient = {
        authorize: function (callback) {
            var err = null;
            var tokens = [];
            callback(err, tokens);
        }
    };

    var errorMessage = 'apiError';
    var youtube = {
        playlistItems: {
            list: function (options, params, callback) {
                t.equal(options.playlistId, playlistId);
                t.deepEqual(options.part, ['snippet']);
                t.equal(options.maxResults, 50);

                var err = new Error(errorMessage);
                var response = [];
                callback(err, responseData, response);
            }
        }
    }

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

    var provider = createProvider(google, key);

    return provider.getVideoItems(playlistId)
        .catch(function (err) {
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});

function createResponseData(items) {
    return {
        kind: 'kind',
        etag: 'etag',
        pageInfo: { totalResults: 5, resultsPerPage: 50 },
        items: items.map(function (elem) {
            return {
                kind: 'youtube#playlistItem',
                etag: 'etag',
                id: 'id42',
                snippet: elem
            }
        })
    }
}