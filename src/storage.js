/**
 * Storage entry point, to be used from other modules 
 */
module.exports = function (s3, bucket) {
    function save(stream, name) {
        // TODO Get list of stored files
        // Only if not stored already, save

        var params = { Bucket: bucket, Key: name, Body: stream };

        return new Promise(function (resolve, reject) {
            s3.upload(params, function (err, data) {
                if (err){
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    return {
        save: save
    }
}