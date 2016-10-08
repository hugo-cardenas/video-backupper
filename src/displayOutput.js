module.exports = function () {
    function outputLine($message) {
        console.log($message);
    }

    return {
        outputLine: outputLine
    };
};
