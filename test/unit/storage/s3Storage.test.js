var test = require('blue-tape');
var baserequire = require('base-require');
var createStorage = baserequire('src/storage/s3Storage');

var invalidConfigs = [
    {},
    { bucket: '' }
];

invalidConfigs.forEach(function (config, index) {
    test('s3Storage - create - invalid config #' + index, function (t) {
        var s3 = {};
        try {
            createStorage(s3, config);
            t.fail();
        } catch (err) {
            t.ok(err.message.includes('Invalid config'));
            t.end();
        }
    });
});

test('s3Storage - save - succeeds', function (t) {
    var config = {
        bucket: 'bucketFoo'
    };
    var videoName = 'videoName42';
    var playlistName = 'playlistName44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };
    var stream = 'I am a stream';

    var expectedKey = playlistName + '/' + videoName + '.mp4';

    var s3 = {
        upload: function (params, callback) {
            t.equal(params.Bucket, config.bucket);
            t.equal(params.Body, stream);
            t.equal(params.Key, expectedKey);

            var err = null;
            var data = 'success';
            callback(err, data);
        }
    };

    var storage = createStorage(s3, config);
    return storage.save(stream, videoItem);
});

var invalidVideoItems = [
    {},
    { videoName: 'foo' },
    { playlistName: 'foo' }
];

invalidVideoItems.forEach(function (videoItem, index) {
    test('s3Storage - save - invalid video item #' + index, function (t) {
        var config = {
            bucket: 'bucketFoo'
        };
        var stream = 'I am a stream';
        var s3 = {
            upload: function () {}
        };

        var storage = createStorage(s3, config);
        return storage.save(stream, videoItem)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(JSON.stringify(videoItem)));
                t.ok(err.message.includes('Invalid videoItem'));
            });
    });
});

test('s3Storage - save - s3 client fails', function (t) {
    var config = {
        bucket: 'bucketFoo'
    };
    var videoName = 'videoName42';
    var playlistName = 'playlistName44';
    var videoItem = {
        videoName: videoName,
        playlistName: playlistName
    };
    var stream = 'I am a stream';

    var expectedKey = playlistName + '/' + videoName + '.mp4';

    var errorMessage = 'Error saving stream';
    var s3 = {
        upload: function (params, callback) {
            t.equal(params.Bucket, config.bucket);
            t.equal(params.Body, stream);
            t.equal(params.Key, expectedKey);

            var err = new Error(errorMessage);
            var data = 'irrelevant';
            callback(err, data);
        }
    };

    var storage = createStorage(s3, config);
    return storage.save(stream, videoItem)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(JSON.stringify(videoItem)));
            t.ok(err.message.includes(errorMessage));
        });
});

test('s3Storage - getAllVideoItems - succeeds', function (t) {
    var bucket = 'bucketFoo';
    var config = {
        bucket: bucket
    };
    var playlistName = 'playlistName';
    var videoName1 = 'videoName1';
    var videoName2 = 'videoName2';

    var videoItem1 = createVideoItem(videoName1, playlistName);
    var videoItem2 = createVideoItem(videoName2, playlistName);
    var expectedVideoItems = [videoItem1, videoItem2];

    var expectedParams = {
        Bucket: bucket
    };

    var s3ClientResponseData = {
        Contents: [
            { Key: playlistName + '/' + videoName1 },
            { Key: playlistName + '/' + videoName2 }
        ]
    };

    var s3 = {
        listObjectsV2: function (params, callback) {
            t.deepEqual(params, expectedParams);
            var err = null;
            callback(err, s3ClientResponseData);
        }
    };
    var storage = createStorage(s3, config);

    return storage.getAllVideoItems()
        .then(function (videoItems) {
            t.deepEqual(videoItems, expectedVideoItems);
        });
});

test('s3Storage - getAllVideoItems - s3 client fails', function (t) {
    var bucket = 'bucketFoo';
    var config = {
        bucket: bucket
    };
    var expectedParams = {
        Bucket: bucket
    };

    var errorMessage = 'Error listing objects';
    var s3 = {
        listObjectsV2: function (params, callback) {
            t.deepEqual(params, expectedParams);
            var err = new Error(errorMessage);
            callback(err, {});
        }
    };
    var storage = createStorage(s3, config);

    return storage.getAllVideoItems()
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes('unable to get all video items'));
            t.ok(err.message.includes(errorMessage));
        });
});

var invalidResponses = [
    {},
    { foo: 'bar' },
    {
        Contents: 'foo'
    },
    {
        Contents: [
            { Key: 'foo/bar' },
            'foo'
        ]
    },
    {
        Contents: [
            { Key: 'foo/bar' },
            {}
        ]
    },
    {
        Contents: [
            { Key: 'foo/bar' },
            { foo: 'bar' }
        ]
    }
];

invalidResponses.forEach(function (invalidResponse, index) {
    test('s3Storage - getAllVideoItems - s3 client returns invalid response #' + index, function (t) {
        var bucket = 'bucketFoo';
        var config = {
            bucket: bucket
        };
        var expectedParams = {
            Bucket: bucket
        };

        var s3 = {
            listObjectsV2: function (params, callback) {
                t.deepEqual(params, expectedParams);
                var err = null;
                callback(err, invalidResponse);
            }
        };
        var storage = createStorage(s3, config);

        return storage.getAllVideoItems()
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes('unable to get all video items'));
                t.ok(err.message.includes(JSON.stringify(invalidResponse)));
            });
    });
});

var invalidKeys = [
    '',
    '/',
    '//',
    '///',
    'foo',
    '/foo',
    'foo/',
    '//foo',
    'foo//',
    '/foo/',
    '//foo/',
    '/foo//',
    '/foo/bar',
    '/foo/bar/'
];

invalidKeys.forEach(function (invalidKey, index) {
    test('s3Storage - getAllVideoItems - s3 response contains invalid key #' + index, function (t) {
        var bucket = 'bucketFoo';
        var config = {
            bucket: bucket
        };
        var expectedParams = {
            Bucket: bucket
        };

        var s3ClientResponseData = {
            Contents: [
                { Key: 'foo/bar' },
                { Key: invalidKey }
            ]
        };

        var s3 = {
            listObjectsV2: function (params, callback) {
                t.deepEqual(params, expectedParams);
                var err = null;
                callback(err, s3ClientResponseData);
            }
        };
        var storage = createStorage(s3, config);

        return storage.getAllVideoItems()
            .then(function () {
                t.fail('Should throw Error');
            })
            .catch(function (err) {
                t.ok(err.message.includes('unable to get all video items'), 'Includes main error message');
                t.ok(err.message.includes(JSON.stringify(invalidKey)), 'Includes invalid key ' + invalidKey);
            });
    });
});

/**
 * @param {string} videoName
 * @param {string} playlistName
 * @returns {Object}
 */
function createVideoItem(videoName, playlistName) {
    return {
        videoName: videoName,
        playlistName: playlistName
    };
}
