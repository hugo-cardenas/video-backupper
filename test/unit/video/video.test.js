const test = require('tape');
const _ = require('lodash');
const baserequire = require('base-require');
const createVideo = baserequire('src/video/video');

test('video - has all properties', function (t) {
    const id = 'videoId';
    const name = 'videoName';
    const playlistName = 'playlistName';

    const video = createVideo(id, name, playlistName);
    t.equal(video.id, id);
    t.equal(video.name, name);
    t.equal(video.playlistName, playlistName);
    t.end();
});

const invalidValues = ['', 0, null, undefined, [], false, true];
const invalidArgs = _.flatten(invalidValues.map(function (val) {
    return [0, 1, 2].map(function (i) {
        const arr = ['videoId', 'videoName', 'playlistName'];
        arr[i] = val;
        return arr;
    });
}));

invalidArgs.forEach(function (args, index) {
    test('video - invalid arguments #' + index, function (t) {
        try {
            createVideo(...args);
            t.fail('Should throw Error due to invalid args');
        } catch (error) {
            t.end();
        }
    });
});
