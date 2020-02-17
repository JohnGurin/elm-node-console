// @flow
import { createReadStream } from "fs";
import Parser from "./elmParser.mjs";
import * as T from "./TypesDomain.mjs";

function performComputation(file, parser): Promise<?T.ModuleData> {
    return new Promise((resolve, reject) => {
        parser.reset();
        const r = createReadStream(file, { encoding: "utf8" });
        r.on("data", chunk => {
            if (parser.feedChunk(chunk)) {
                r.close();
                // reject("rejected " + file);
            }
        });
        r.on("end", () => {
            const result = parser.getResults();
            resolve(result);
        });
    });
}

export function gatherModulesData(
    files: T.ElmFiles,
    varNameExaminer: T.VarNameExaminer
): Promise<T.ModulesData> {
    const modulesData = [];
    const parser = Parser(varNameExaminer);

    let sequence = Promise.resolve([]);
    files.forEach(file => {
        sequence = sequence
            .then(() => performComputation(file, parser))
            .then(result => {
                if (result) modulesData.push(result);
            });
    });

    return sequence.then(() => modulesData);
}

export function varNameExaminerFactory(
    varOptions: T.VarOptions
): T.VarNameExaminer {
    const {
        isAll,
        predefined,
        prefixes,
        suffixes,
        regexpes
    } = varOptions;

    if (isAll) return () => true;

    const examiners = [];
    predefined && examiners.push(predefinedExaminerFactory(predefined));
    prefixes && examiners.push(prefixesExaminerFactory(prefixes));
    suffixes && examiners.push(suffixesExaminerFactory(suffixes));
    regexpes && examiners.push(regexpesExaminerFactory(regexpes));
    return varName => examiners.some(f => f(varName));
}

function predefinedExaminerFactory(predefined) {
    const names = new Set(predefined);
    return function predefinedExaminer(varName) {
        return names.has(varName);
    };
}

function prefixesExaminerFactory(prefixes) {
    return prefixes.length === 1
        ? varName => varName.startsWith(prefixes[0])
        : varName => prefixes.some(prefix => varName.startsWith(prefix));
}

function suffixesExaminerFactory(suffixes) {
    return suffixes.length === 1
        ? varName => varName.endsWith(suffixes[0])
        : varName => suffixes.some(suffix => varName.endsWith(suffix));
}

function regexpesExaminerFactory(regexpes) {
    const rxs = regexpes.map(r => RegExp(r));
    return varName => rxs.some(rx => rx.test(varName));
}
