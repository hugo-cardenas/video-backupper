module.exports = function (google, config) {
    function createJwtClient() {
        return new google.auth.JWT(
            config.email,
            config.keyFile,
            null,
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
            });
        });
    }

    function extractVideoItems(responseData) {
        // TODO Validate response, ensure that videoId is found inside
        return responseData.items.map(function (elem) {
            return elem.snippet;
        });
    }

    function getItems(jwtClient, playlistId) {
        return new Promise(function (resolve, reject) {
            var youtube = google.youtube({
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
};
