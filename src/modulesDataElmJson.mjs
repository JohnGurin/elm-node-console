// @flow
import { relative, isAbsolute } from "path";
import { readFileSync } from "fs";

import * as T from "./TypesDomain.mjs";

function subdirs(parent, target): ?Array<string> {
    const rel = relative(parent, target);
    const isSubdir = rel && !rel.startsWith("..") && !isAbsolute(rel);
    return isSubdir ? rel.split(/[\\/]/g) : undefined;
}

function elmSourceDirs(): T.Path[] {
    return JSON.parse(readFileSync("elm.json", "utf8"))["source-directories"];
}

function deriveElmModulesNames(
    elmSourceDirs: T.Path[],
    elmFiles: T.ElmFiles
): T.ElmModuleName[] {
    return elmFiles.reduce((modules, file) => {
        let parts;
        elmSourceDirs.find(srcDir => {
            parts = subdirs(srcDir, file.replace(/\.elm$/, ""));
            return parts;
        });
        if (parts) modules.push(parts.join("."));
        else console.warn(`${file} is not in elm.json source-directories`);
        return modules;
    }, []);
}

export async function gatherModulesData(
    elmFiles: T.ElmFiles,
    predefinedVars: T.ElmVarNames
): Promise<T.ModulesData> {
    const modules = deriveElmModulesNames(elmSourceDirs(), elmFiles);
    const modulesData = modules.reduce((acc, m) => {
        acc.push({ name: m, vars: predefinedVars });
        return acc;
    }, []);
    return Promise.resolve(modulesData);
}
