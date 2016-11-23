var test = require('blue-tape');
var sinon = require('sinon');
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

test.only('s3Storage - isStored - succeeds', function (t) {
    // TODO Test it does only one single call to S3, then cache the stored files
    // TODO When saving, delete the local cached list
    var bucket = 'bucketFoo';
    var config = {
        bucket: bucket
    };
    var playlistName = 'playlistName';
    var videoName1 = 'videoName1';
    var videoName2 = 'videoName2';
    var videoName3 = 'videoName3';

    var videoItem1 = createVideoItem(videoName1, playlistName);
    var videoItem2 = createVideoItem(videoName2, playlistName);
    var videoItem3 = createVideoItem(videoName3, playlistName);

    var expectedParams = {
        Bucket: bucket
    };

    var s3ClientResponseData = {
        Contents: [
            { Key: '/' + playlistName + '/' + videoName1 },
            { Key: '/' + playlistName + '/' + videoName2 },
            { Key: '/irrelevantPlaylist/irrelevantVideo' }
        ]
    };

    var s3 = {
        listObjectsV2: function (params, callback) {
            t.deepEqual(params, expectedParams);
            var err = null;
            callback(err, s3ClientResponseData);
        }
    };
    var s3ListObjectsSpy = sinon.spy(s3, 'listObjectsV2');

    var storage = createStorage(s3, config);

    // First call is done separately to ensure that the list gets cached before calling others
    return storage.isStored(videoItem1)
        .then(function (isStored) {
            t.ok(isStored);
        })
        .then(function () {
            return Promise.all([
                storage.isStored(videoItem2),
                storage.isStored(videoItem3)
            ]);
        })
        .then(function (values) {
            t.ok(values[0]);
            t.notOk(values[1]);
            t.ok(s3ListObjectsSpy.calledOnce);
        });
});

test('s3Storage - isStored - cleans cached list after save', function () {

});

test('s3Storage - isStored - s3 client fails', function (t) {

});

test('s3Storage - isStored - s3 client returns invalid response', function (t) {

});

test('s3Storage - isStored - s3 client returns invalid key', function (t) {

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
