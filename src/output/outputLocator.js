var baserequire = require('base-require');
var createDisplayOutput = baserequire('src/output/displayOutput');

var _displayOutput;

/**
 * @returns {Object}
 */
function getDisplayOutput() {
    if (!_displayOutput) {
        _displayOutput = createDisplayOutput();
    }
    return _displayOutput;
}

/**
 * @param {Object} displayOutput
 */
function setDisplayOutput(displayOutput) {
    _displayOutput = displayOutput;
}

module.exports = {
    getDisplayOutput: getDisplayOutput,
    setDisplayOutput: setDisplayOutput
};
