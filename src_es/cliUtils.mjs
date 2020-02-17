import { EOL } from 'os';

function help(cliConfig) {
  let out = "";
  cliConfig.forEach(({
    name,
    desc,
    opts
  }) => {
    if (desc) out += desc + EOL;
    opts && opts.forEach(({
      name,
      def,
      key,
      desc
    }) => {
      if (key) out += "-" + key + " ";
      out += "--" + name;
      if (def) out += "\t\t" + `(default: ${def})`;
      if (desc) out += " (?) " + desc;
      out += EOL;
    });
    out += EOL;
  });
  return out;
}
function argsToCliOpts(args, cfg) {
  const optToGroup = new Map();
  const keyToOpt = new Map();
  const fns = new Map();
  const defaults = {};
  cfg.forEach(group => {
    defaults[group.name] = {};
    group.opts && group.opts.forEach(opt => {
      optToGroup.set(opt.name, group.name);
      if (opt.key) keyToOpt.set(opt.key, opt.name);
      if (opt.fn) fns.set(opt.name, opt.fn);
      if (opt.def) defaults[group.name][opt.name] = opt.fn && opt.fn(opt.def) || opt.def;
    });
  });
  const cliOpts = Object.entries(args).reduce((acc, [k, v]) => {
    if (!v) return acc;
    const optName = keyToOpt.get(k) || optToGroup.has(k) && k;
    const groupName = optToGroup.get(optName);

    if (optName && groupName) {
      const fn = fns.get(optName);
      acc[groupName][optName] = fn && fn(v) || v;
    }

    return acc;
  }, defaults);
  cliOpts.elmFiles = args._;
  return cliOpts;
}

export { argsToCliOpts, help };
