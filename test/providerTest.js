var test = require('blue-tape');
var createProvider = require('./../src/provider');

test('getItems succeeds', function (t) {
    var playlistId = 'playlistId42';

    var expectedItems = ['item1', 'item2'];

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
                var items = ['item1', 'item2'];
                var response = [];
                callback(err, items, response);
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
        .then(function (items) {
            t.deepEqual(items, expectedItems);
            return Promise.resolve();
        });
});


test('getItems authorization error', function (t) {
    var playlistId = 'playlistId42';

    var expectedItems = ['item1', 'item2'];

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
        .catch(function(err){
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});

test('getItems list error', function (t) {
    var playlistId = 'playlistId42';

    var expectedItems = ['item1', 'item2'];

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
                var items = ['item1', 'item2'];
                var response = [];
                callback(err, items, response);
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
        .catch(function(err){
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});

