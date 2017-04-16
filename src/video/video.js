module.exports = function (videoId, videoName, playlistId, playlistName) {
    [...arguments].forEach(function (arg) {
        if (typeof arg !== 'string' || arg === '') {
            throw new Error('Invalid parameters. All of them should be non empty strings');
        }
    });
    return {
        videoId,
        videoName,
        playlistId,
        playlistName
    };
};
