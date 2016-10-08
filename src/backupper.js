module.exports = function (provider, ytdl, storage, displayOutput) {
    // TODO Use proper query build
    var baseVideoUrl = 'https://www.youtube.com/watch?v=';

    function getVideoUrl(videoId) {
        return baseVideoUrl + videoId;
    }

    function backup(playlistId, videoId) {
        return new Promise(function (resolve, reject) {
            try {
                var url = getVideoUrl(videoId);
                var stream = ytdl(url);
            } catch (err) {
                return reject(createError(videoId, err));
            }

            storage.save(stream, playlistId, videoId)
                .then(function () {
                    displayOutput.outputLine('Success saving video ' + videoId);
                    return resolve();
                })
                .catch(function (err) {
                    return reject(createError(videoId, err));
                });
        });
    }

    function createError(videoId, previousErr) {
        var message = 'Backup failed for video id: ' + videoId + ', reason: ' + previousErr.message;
        displayOutput.outputLine(message);
        return new Error(message);
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
                displayOutput.outputLine('Found ' + videoItems.length + ' video items');
                return backupVideoItems(playlistId, videoItems);
            });
    }

    return {
        run: run
    };
};
