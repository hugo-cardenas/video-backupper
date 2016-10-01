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

    function extractVideoItems(responseData){
        return responseData.items.map(function(elem){
            return elem.snippet;
        });
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

            youtube.playlistItems.list(options, {}, function (err, data, response) {
                if (err) {
                    return reject(err);
                }
                return resolve(extractVideoItems(data));
            });
        });
    }

    function getVideoItems(playlistId) {
        return createAuthorizedJwtClient()
            .then(function (jwtClient) {
                return getItems(jwtClient, playlistId);
            });
    }

    return {
        getVideoItems: getVideoItems
    };
}

