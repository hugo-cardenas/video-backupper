module.exports = function (google, key) {
    function createJwtClient() {
        return new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            ['https://www.googleapis.com/auth/youtube.readonly'],
            null
        );
    }

    function createAuthorizedJwtClient() {
        return new Promise(function (resolve, reject) {
            var jwtClient = createJwtClient();
            jwtClient.authorize(function (err, tokens) {
                if (err) {
                    return reject(err);
                }
                return resolve(jwtClient);
            })
        })
    }

    function getItems(jwtClient, playlistId) {
        return new Promise(function (resolve, reject) {
            youtube = google.youtube({
                version: 'v3',
                auth: jwtClient
            });

            var options = {
                playlistId: playlistId,
                part: ['snippet'],
                maxResults: 50
            };

            var result = youtube.playlistItems.list(options, {}, function (err, data, response) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    function getVideoItems(playlistId) {
        return new Promise(function (resolve, reject) {
            createAuthorizedJwtClient()
                .then(function(jwtClient){
                    return getItems(jwtClient, playlistId);
                })
                .then(function(data){
                    console.log('success');
                    return console.log(data);
                })
                .catch(function(err){
                    return console.log(err);
                })
        });
    }

    return {
        getVideoItems: getVideoItems
    };
}

