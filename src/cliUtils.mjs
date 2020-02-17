// @flow
import { EOL } from "os";

export type CliGroup = {|
    name: string,
    opts?: CliOption[],
    desc?: string
|};

export type CliOption = {|
    name: string,
    key?: string,
    def?: string,
    desc?: string,
    fn?: any => any
|};

export type CliConfig = CliGroup[];

export function help(cliConfig: CliConfig) {
    let out = "";
    cliConfig.forEach(({ name, desc, opts }) => {
        if (desc) out += desc + EOL;
        opts &&
            opts.forEach(({ name, def, key, desc }) => {
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

export function argsToCliOpts(args: { [key: string]: any }, cfg: CliConfig) {
    const optToGroup = new Map();
    const keyToOpt = new Map();
    const fns = new Map();
    const defaults = {};
    cfg.forEach(group => {
        defaults[group.name] = {};
        group.opts &&
            group.opts.forEach(opt => {
                optToGroup.set(opt.name, group.name);
                if (opt.key) keyToOpt.set(opt.key, opt.name);
                if (opt.fn) fns.set(opt.name, opt.fn);
                if (opt.def)
                    defaults[group.name][opt.name] =
                        (opt.fn && opt.fn(opt.def)) || opt.def;
            });
    });
    const cliOpts = Object.entries(args).reduce((acc, [k, v]) => {
        if (!v) return acc;
        const optName = keyToOpt.get(k) || (optToGroup.has(k) && k);
        const groupName = optToGroup.get(optName);
        if (optName && groupName) {
            const fn = fns.get(optName);
            acc[groupName][optName] = (fn && fn(v)) || v;
        }
        return acc;
    }, defaults);
    cliOpts.elmFiles = args._;

    return cliOpts;
}
