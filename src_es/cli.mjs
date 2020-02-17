import { mainCli } from './main.mjs';
import gar from 'gar';
import { argsToCliOpts, help } from './cliUtils.mjs';

const commaSplit = opt => opt.split(",");

const cliConfig = [{
  name: "mainOptions",
  opts: [{
    name: "elmBin",
    def: "elm",
    key: "b"
  }, {
    name: "tmpDir",
    def: "elm-stuff",
    key: "t"
  }, {
    name: "runnerModuleName",
    def: "NodeConsole_",
    key: "n"
  }, {
    name: "isNodeStderr",
    key: "e",
    desc: "output stderr of compiled js"
  }, {
    name: "isCachedRunner",
    key: "C",
    desc: "reuse elm runner file ($tmpDir)/($runnerModuleName).elm"
  }, {
    name: "cachedRunner",
    key: "c",
    desc: "reuse elm runner file, path"
  }, {
    name: "isColorOutput",
    key: "q"
  }]
}, {
  name: "varOptions",
  desc: "Which top level variables to select.\nEach option (except isAll) is comma separated,\nso commas can't be used in regexpes",
  opts: [{
    name: "isAll",
    key: "A"
  }, {
    name: "predefinedNoParse",
    key: "w",
    fn: commaSplit,
    desc: "create elm runner without touching *.elm files"
  }, {
    name: "predefined",
    key: "l",
    fn: commaSplit,
    desc: "exact variable names"
  }, {
    name: "prefixes",
    key: "p",
    fn: commaSplit
  }, {
    name: "suffixes",
    key: "s",
    fn: commaSplit
  }, {
    name: "regexpes",
    key: "r",
    fn: commaSplit
  }]
}];
const cliOpts = argsToCliOpts(gar(process.argv.slice(2)), cliConfig);
process.env.DEBUG && console.log(cliOpts);

if (Object.keys(cliOpts.varOptions).length === 0 || !cliOpts.elmFiles || cliOpts.elmFiles.length === 0) {
  const usage = `usage: elm-node-console -A t M1.elm M2.elm
        elm-node-console -s out,log M1.elm M2.elm
        All boolean options must be followed by some value if precede positional
        arguments (due to usage of simple cli parser)`;
  console.log(help(cliConfig), usage);
} else {
  mainCli(cliOpts);
}
