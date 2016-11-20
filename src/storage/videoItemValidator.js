var _ = require('lodash');
var VError = require('verror');

/**
 * @param {Object} videoItem
 */
module.exports = function validateVideoItem(videoItem) {
    var keys = ['videoName', 'playlistName'];
    var missingKeys = _.difference(keys, Object.keys(videoItem));
    if (missingKeys.length > 0) {
        throw new VError('Invalid videoItem %s, missing keys [%s]', JSON.stringify(videoItem), missingKeys.join(', '));
    }
};
