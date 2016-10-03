module.exports = function (provider, ytdl, storage) {

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';

    function getVideoUrl(videoId) {
        return baseVideoUrl + videoId;
    }

    function backup(videoId) {
        return new Promise(function (resolve, reject) {
            var errorMessage = 'Error in backup of video id: ' + videoId + ', reason: ';
            try {
                var url = getVideoUrl(videoId);
                var stream = ytdl(url);
            }
            catch (err) {
                return reject(new Error(errorMessage + err.message));
            }

            storage.save(stream, videoId)
                .then(function () {
                    return resolve();
                })
                .catch(function (err) {
                    return reject(new Error(errorMessage + err.message));
                });
        });
    }

    /**
     * Resolve in parallel all video backups, return promise resolved with error list
     */
    function backupVideoItems(videoItems) {
        var promises = videoItems.map(function (videoItem) {
            return backup(videoItem.resourceId.videoId);
        });

        var solvedPromises = promises.map(function (promise) {
            return promise
                .then(function(){
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
                }))
            });
    }

    function run(playlistId) {
        return provider.getVideoItems(playlistId)
            .then(backupVideoItems);
    }

    return {
        run: run
    };
}