const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');
const VError = require('verror');
const promiseFilter = require('bluebird').filter;
const baserequire = require('base-require');
const createVideo = baserequire('src/video/video');

module.exports = function (baseDir) {
    /**
     * @returns {Promise<Object>} Resolves with array of videos {id, name, playlistName}
     */
    function getAllVideoItems() {
        return getPlaylists()
            .then(playlists => {
                return Promise.all(
                    playlists.map((playlist) => getVideos(playlist))
                );
            })
            .then(_.flatten)
            .catch(err => {
                throw createGetAllVideoItemsError(err);
            });
    }

    /**
     * @returns {Promise<string[]>}
     */
    function getPlaylists() {
        return fs.readdir(baseDir)
            .then(filterDirs);
    }

    /**
     * @param {string[]} elements
     * @returns {Promise<string[]>}
     */
    function filterDirs(elements) {
        return promiseFilter(elements, element => {
            return fs.stat(path.join(baseDir, element))
                .then(stats => stats.isDirectory());
        });
    }

    /**
     * @param {string[]} elements
     * @returns {Promise<string[]>}
     */
    function filterFiles(playlist, elements) {
        return promiseFilter(elements, element => {
            return fs.stat(path.join(baseDir, playlist, element))
                .then(stats => stats.isFile());
        });
    }

    /**
     * @param {string} playlist
     * @returns {Promise<Object>} Resolves with array of videos {id, name, playlistName}
     */
    function getVideos(playlist) {
        return fs.readdir(path.join(baseDir, playlist))
            .then(elements => filterFiles(playlist, elements))
            .then(fileNames => {
                return fileNames.map(fileName => buildVideo(playlist, fileName));
            });
    }

    /**
     * @param {string} playlist
     * @param {string} fileName
     * @returns {Object} {id, name, playlistName}
     */
    function buildVideo(playlist, fileName) {
        // Example: videoBar_42.foo
        const regex = /^([^/]+)_([0-9a-zA-Z]+)\.[0-9a-zA-Z]+$/;
        const result = regex.exec(fileName);

        if (result && result[1] && result[2]) {
            const name = result[1];
            const id = result[2];
            return createVideo(id, name, playlist);
        }

        throw new VError('Invalid file name "%s"', fileName);
    }

    /**
     * @param {Error} err
     * @returns {Error}
     */
    function createGetAllVideoItemsError(err) {
        return new VError(err, 'File storage unable to get all video items');
    }

    /**
     * @param {Object} videoItem
     * @param {Error} err
     * @returns {Error}
     */
    function createSaveError(videoItem, err) {
        return new VError(err, 'File storage unable to save stream for videoItem %s', JSON.stringify(videoItem));
    }

    return {
        getAllVideoItems
    };
};
