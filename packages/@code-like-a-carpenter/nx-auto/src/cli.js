'use strict';

const yargs = require('yargs');

yargs(process.argv.slice(2)).commandDir('./commands').help().demandCommand()
  .argv;
