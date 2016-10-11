var test = require('blue-tape');
var baserequire = require('base-require');
var createStorage = baserequire('src/storage/s3Storage');

test('s3Storage - save - succeeds', function (t) {
    var config = {
        bucket: 'bucketFoo'
    };
    var playlistId = 'playlistId40';
    var videoId = 'videoId42';
    var stream = 'I am a stream';

    var expectedKey = playlistId + '/' + videoId + '.mp4';

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
    return storage.save(stream, playlistId, videoId)
        .then(function () {
            return Promise.resolve();
        });
});

test('s3Storage - save - fails', function (t) {
    var config = {
        bucket: 'bucketFoo'
    };
    var playlistId = 'playlistId40';
    var videoId = 'videoId42';
    var stream = 'I am a stream';

    var expectedKey = playlistId + '/' + videoId + '.mp4';

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
    return storage.save(stream, playlistId, videoId)
        .catch(function (err) {
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});
