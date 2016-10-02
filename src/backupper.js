module.exports = function (provider, ytdl, storage, config) {

    var bucket = config.bucket;
    var playlistId = config.playlistId;

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';

    function getVideoUrl(videoId) {
        return baseVideoUrl + videoId;
    }

    // TODO Find a proper solution for Promise.all error handling
    // TODO Find out how to properly wrap errors inside errors
    function backup(videoId) {
        return new Promise(function (resolve, reject) {
            var errorMessage = 'Error in backup of video id: ' + videoId + ', reason: ';
            try {
                var url = getVideoUrl(videoId);
                var stream = ytdl(url);
            }
            catch (err) {
                return resolve(new Error(errorMessage + err.message));
            }
            
            storage.save(stream, videoId)
                .then(function(){
                    return resolve();
                })
                .catch(function(err){
                    return resolve(new Error(errorMessage + err.message));
                });
        });
    }

    // TODO Clean
    /**
     * Resolve in parallel all video backups, return promise resolved with error list
     */
    function backupVideoItems(videoItems) {
        return Promise.all(videoItems.map(function (videoItem) {
            return backup(videoItem.resourceId.videoId);
        }))
            .then(function (errors) {
                return Promise.resolve(errors.filter(function (e) {
                    return e;
                }))
            })
    }

    function run() {
        return provider.getVideoItems(playlistId)
            .then(backupVideoItems);
    }

    return {
        run: run
    };
}