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
