var ytdl = require('ytdl-core');
var baserequire = require('base-require');

var createBackupper = baserequire('src/backupper');
var createDisplayOutput = baserequire('src/output/displayOutput');

var storageLocator = baserequire('src/storage/storageLocator');
var providerLocator = baserequire('src/provider/providerLocator');

var backupper;
var displayOutput;

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    if (!displayOutput) {
        displayOutput = createDisplayOutput();
    }
    return displayOutput;
}

/**
 * @returns {Storage}
 */
function getStorage() {
    return storageLocator.getStorage();
}

/**
 * @returns {Provider}
 */
function getProvider() {
    return providerLocator.getProvider();
}

/**
 * @returns {Backupper}
 */
function getBackupper() {
    if (!backupper) {
        backupper = createBackupper(getProvider(), ytdl, getStorage(), getDisplayOutput());
    }
    return backupper;
}

module.exports = {
    getBackupper: getBackupper
};
