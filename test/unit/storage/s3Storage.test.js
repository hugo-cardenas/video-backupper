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
    var id = 'videoId';
    var name = 'videoName';
    var playlistName = 'playlistName';
    var videoItem = { id, name, playlistName };
    var stream = 'I am a stream';

    var expectedKey = `${playlistName}/${name}_${id}.mp4`;
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
    { id: 'foo' },
    { id: 'foo', name: 'bar' },
    { id: 'foo', playlistName: 'bar' }
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

    var id = 'videoId';
    var name = 'videoName';
    var playlistName = 'playlistName';
    var videoItem = { id, name, playlistName };

    var stream = 'I am a stream';

    var expectedKey = `${playlistName}/${name}_${id}.mp4`;

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
    var playlistName = 'playlist Name';

    var id1 = 'videoId1';
    var name1 = 'video Name 1';

    var id2 = 'videoId2';
    var name2 = 'video_Name_2'; // Underscores in name should not affect extraction of id

    var videoItem1 = createVideoItem(id1, name1, playlistName);
    var videoItem2 = createVideoItem(id2, name2, playlistName);
    var expectedVideoItems = [videoItem1, videoItem2];

    var expectedParams = {
        Bucket: bucket
    };

    var s3ClientResponseData = {
        Contents: [
            { Key: `${playlistName}/${name1}_${id1}.foo` },
            { Key: `${playlistName}/${name2}_${id2}.foo2` }
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
            { Key: 'foo/bar_42.baz' },
            'foo'
        ]
    },
    {
        Contents: [
            { Key: 'foo/bar_42.baz' },
            {}
        ]
    },
    {
        Contents: [
            { Key: 'foo/bar_42.baz' },
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
    'foo_42',
    '/foo',
    '/foo_42',
    'foo/',
    '//foo',
    'foo//',
    '/foo/',
    '//foo/',
    '/foo//',
    '/foo/bar',
    '/foo/bar/',
    'foo/bar_42', // Missing file extension
    'foo/bar.baz' // Missing id
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
                { Key: 'foo/bar_42.baz' },
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
 * @param {string} id
 * @param {string} name
 * @param {string} playlistName
 * @returns {Object}
 */
function createVideoItem(id, name, playlistName) {
    return {id, name, playlistName};
}
