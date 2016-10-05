var program = require('commander');

program
  .version('0.0.1')
  .description('Backup videos from a youtube playlist')
  .option('-p, --playlist', 'Id of the youtube playlist')
  .option('-k, --key', 'Youtube key file')
  .option('-c, --config', 'Json config file')
  .parse(process.argv);