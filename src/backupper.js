module.exports = function (provider, ytdl, storage) {
    // TODO Use proper query build
    var baseVideoUrl = 'https://www.youtube.com/watch?v=';

    function getVideoUrl(videoId) {
        return baseVideoUrl + videoId;
    }

    function backup(playlistId, videoId) {
        return new Promise(function (resolve, reject) {
            var errorMessage = 'Error in backup of video id: ' + videoId + ', reason: ';
            try {
                var url = getVideoUrl(videoId);
                var stream = ytdl(url);
            } catch (err) {
                //console.log('Error downloading video ' + videoId + ': ' + err.message);
                return reject(new Error(errorMessage + err.message));
            }

            storage.save(stream, playlistId, videoId)
                .then(function () {
                    //console.log('Success saving video ' + videoId);
                    return resolve();
                })
                .catch(function (err) {
                    //console.log('Error uploading video ' + videoId + ': ' + err.message);
                    return reject(new Error(errorMessage + err.message));
                });
        });
    }

    /**
     * Resolve in parallel all video backups, return promise resolved with error list
     */
    function backupVideoItems(playlistId, videoItems) {
        var promises = videoItems.map(function (videoItem) {
            return backup(playlistId, videoItem.resourceId.videoId);
        });

        var solvedPromises = promises.map(function (promise) {
            return promise
                .then(function () {
                    // TODO
                    console.log('Completed promise');
                    return Promise.resolve();
                })
                .catch(function (err) {
                    return Promise.resolve(err);
                });
        });

        return Promise.all(solvedPromises)
            .then(function (errors) {
                return Promise.resolve(errors.filter(function (e) {
                    return e;
                }));
            });
    }

    function run(playlistId) {
        return provider.getVideoItems(playlistId)
            .then(function (videoItems) {
                //console.log('Found ' + videoItems.length + ' video items');
                return backupVideoItems(playlistId, videoItems);
            });
    }

    return {
        run: run
    };
};
