var test = require('blue-tape');
var createStorage = require('./../../src/storage');

test('storage - save - succeeds', function (t) {
    var bucket = 'bucketFoo';
    var name = 'foobar';
    var stream = 'I am a stream';

    var s3 = {
        upload: function(params, callback){
            t.equal(params.Bucket, bucket);
            t.equal(params.Body, stream);
            t.equal(params.Key, name);

            var err = null;
            var data = 'success';
            callback(err, data);
        }
    };

    var storage = createStorage(s3, bucket);
    return storage.save(stream, name)
        .then(function(){
            return Promise.resolve();
        });
});

test('storage - save - fails', function (t) {
    var bucket = 'bucketFoo';
    var name = 'foobar';
    var stream = 'I am a stream';

    var errorMessage = 'Error saving stream';
    var s3 = {
        upload: function(params, callback){
            t.equal(params.Bucket, bucket);
            t.equal(params.Body, stream);
            t.equal(params.Key, name);

            var err = new Error(errorMessage);;
            var data = 'irrelevant';
            callback(err, data);
        }
    };

    var storage = createStorage(s3, bucket);
    return storage.save(stream, name)
        .catch(function(err){
            t.equal(err.message, errorMessage);
            return Promise.resolve();
        });
});