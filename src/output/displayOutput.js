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
    function outputLine(message) {
        message = '[' + (new Date()).toISOString() + '] ' + message;
        console.log(message);
        // fs.appendFileSync('/tmp/backupper.log', message + '\n');
    }

    return {
        outputLine: outputLine
    };
};
