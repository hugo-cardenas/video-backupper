module.exports = function (id, name, playlistName) {
    [...arguments].forEach(function (arg) {
        if (typeof arg !== 'string' || arg === '') {
            throw new Error('Video factory invalid parameters. All of them should be non empty strings');
        }
    });
    return {
        id,
        name,
        playlistName
    };
};
