var ytdl = require('ytdl-core');
var baserequire = require('base-require');

var createBackupper = baserequire('src/backupper');
var createDisplayOutput = baserequire('src/output/displayOutput');

var storageLocator = baserequire('src/storage/storageLocator');
var providerLocator = baserequire('src/provider/providerLocator');

var _ytdl;
var _displayOutput;
var _backupper;

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    if (!_displayOutput) {
        _displayOutput = createDisplayOutput();
    }
    return _displayOutput;
}

/**
 * @param {DisplayOutput} displayOutput
 */
function setDisplayOutput(displayOutput) {
    _displayOutput = displayOutput;
}

/**
 * @returns {Provider}
 */
function getProvider() {
    return providerLocator.getProvider();
}

/**
 * @returns {Object} Ytdl library method
 */
function getYtdl() {
    if (!_ytdl) {
        _ytdl = require('ytdl-core');
    }
    return _ytdl;
}

/**
 * @param {Object} ytdl Ytdl library method
 */
function setYtdl(ytdl) {
    _ytdl = ytdl;
}

/**
 * @returns {Storage}
 */
function getStorage() {
    return storageLocator.getStorage();
}

/**
 * @returns {Backupper}
 */
function getBackupper() {
    if (!_backupper) {
        _backupper = createBackupper(getProvider(), ytdl, getStorage(), getDisplayOutput());
    }
    return _backupper;
}

module.exports = {
    getYtdl: getYtdl,
    setYtdl: setYtdl,
    getDisplayOutput: getDisplayOutput,
    setDisplayOutput: setDisplayOutput,
    getBackupper: getBackupper
};
