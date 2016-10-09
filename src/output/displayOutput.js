/**
 * @typedef {Object} DisplayOutput
 *
 * @property {function} outputLine Write a line to the display output
 */

/**
 * @returns {DisplayOutput}
 */
module.exports = function () {
    /**
     * Write a line to the display output
     *
     * @param {string} $message
     */
    function outputLine($message) {
        console.log($message);
    }

    return {
        outputLine: outputLine
    };
};
