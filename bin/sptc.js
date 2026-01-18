#!/usr/bin/env node

const {NodeCGI}=require('../dist/httpServer')
const {Command}=require('commander')
const version=require('../package.json').version
const program=new Command()
  .name(`sptc`)
  .description(`sptc`)
  .version(version)
  .arguments('<filename>', 'Sptc filename.')
  .option('-d, --defines <string>', 'Macro definition switches. Separate multiple switches with a comma.', '')
  .action((filename, {defines})=>{
    NodeCGI(filename, defines)
  })
  .parse()
