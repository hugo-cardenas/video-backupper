const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');
const VError = require('verror');
const promiseFilter = require('bluebird').filter;
const baserequire = require('base-require');
const createVideo = baserequire('src/video/video');

/**
 * @param {string} baseDir
 * @returns {Object} File storage {getAllVideoItems, save}
 */
module.exports = function (baseDir) {
    const extension = 'mp4';

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
     * @param {Stream} stream
     * @param {Object} videoItem {id, name, playlistName}
     * @returns {Promise}
     */
    function save(stream, videoItem) {
        return Promise.resolve()
            .then(() => validateVideo(videoItem))
            .then(() => getFilePath(videoItem))
            .then(filePath => {
                return fs.ensureFile(filePath)
                    .then(() => filePath);
            })
            .then(fs.createWriteStream)
            .then(writeStream => pipeStream(stream, writeStream))
            .catch(err => {
                throw createSaveError(videoItem, err);
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
        // Example: videoBar (42).foo
        const regex = /^([^/]+)\s\(([^\s]+)\)\.[0-9a-zA-Z]+$/;
        const result = regex.exec(fileName);

        if (result && result[1] && result[2]) {
            const name = result[1];
            const id = result[2];
            return createVideo(id, name, playlist);
        }

        throw new VError('Invalid file name "%s"', fileName);
    }

    /**
     * @param {Object} video {id, name, playlistName}
     * @throws {Error}
     */
    function validateVideo(video) {
        const mandatoryProperties = ['id', 'name', 'playlistName'];
        const invalidProperties = mandatoryProperties.filter(property => {
            return !video[property] ||
                typeof video[property] !== 'string' ||
                video[property].includes('/');
        });
        if (invalidProperties.length > 0) {
            throw new VError(
                'Invalid video %s, missing or invalid properties [%s]',
                JSON.stringify(video),
                invalidProperties.join(', ')
            );
        }
    }

    /**
     * @param {Object} video
     * @returns {string}
     */
    function getFilePath(video) {
        return path.join(
            baseDir,
            video.playlistName,
            `${video.name} (${video.id}).${extension}`
        );
    }

    /**
     * @param {Stream} fromStream
     * @param {Stream} toStream
     * @returns {Promise}
     */
    function pipeStream(fromStream, toStream) {
        return new Promise((resolve, reject) => {
            fromStream.pipe(toStream);
            fromStream.on('end', () => resolve());
            fromStream.on('error', err => {
                toStream.end();
                return reject(err);
            });
            toStream.on('error', err => reject(err));
        });
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
        getAllVideoItems,
        save
    };
};
