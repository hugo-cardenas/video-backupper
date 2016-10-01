/**
 * This storage handles storing the video files in S3
 */
module.exports = function (aws, config) {

    /**
     * Save stream contents with specific name
     */
    function save(stream, name) {

    }

    /**
     * Return list of file names already stored
     */
    function list() {

    }

    return {
        save: save,
        list: list
    };
};