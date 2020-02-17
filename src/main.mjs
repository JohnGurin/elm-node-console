// @flow
import * as T from "./TypesDomain.mjs";

import { createReadStream, writeFileSync } from "fs";
import { Readable } from "stream";
import { execSync, spawn } from "child_process";

process.stdout.write("");

export function renderElmRunnerTemplate(
    runnerModuleName: string,
    modulesData: T.ModulesData
) {
    const varOutput = ([n, v]) =>
        `        ["${n}","${v}",Debug.toString ${n}.${v}]`;
    const moduleOutputs = m => m.vars.map(v => varOutput([m.name, v]));
    return [
        `port module ${runnerModuleName} exposing (main)`,
        `import Platform exposing (Program)`,
        modulesData.map(m => "import " + m.name).join("\n"),
        `port toJs : List (List String) -> Cmd msg`,
        `main : Program String () Never`,
        `main = Platform.worker`,
        `    { init = \\_ -> ((), toJs [`,
        modulesData.flatMap(moduleOutputs).join(",\n"),
        `    ])`,
        `    , update = \\_ _ -> (() , Cmd.none)`,
        `    , subscriptions = \\_ -> Sub.none`,
        `    }`
    ].join("\n");
}

export function spawnNodeElmPlatform(
    mainOptions: T.MainOptions,
    elmRunnerPath_?: T.Path,
    elmRunnerCompiledPath_?: T.Path
) {
    const {
        elmBin,
        tmpDir,
        runnerModuleName,
        isNodeStderr,
        isColorOutput
    } = mainOptions;
    const elmRunnerPath = elmRunnerPath_ || `${tmpDir}/${runnerModuleName}.elm`;
    const elmRunnerCompiledPath =
        elmRunnerCompiledPath_ || `${tmpDir}/${runnerModuleName}.js`;

    try {
        execSync(
            `"${elmBin}" make ${elmRunnerPath} --output ${elmRunnerCompiledPath}`,
            { stdio: ["ignore", "ignore", "inherit"] }
        );
    } catch (e) {
        process.exit();
    }

    const Reset = "\x1b[0m";
    const FgYellow = "\x1b[33m";
    const FgCyan = "\x1b[36m";

    const jsIntro = isColorOutput
        ? `function o(a){console.log(a.map(([m,n,v])=>'${FgCyan}'+m+'${Reset}'+'.'+'${FgYellow}'+n+'\\n'+'${Reset}'+v).join('\\n\\n'))};let r={};(function(){!`
        : `function o(a){console.log(a.map(([m,n,v])=>m+'.'+n+'\\n'+v).join('\\n\\n'))};let r={};(function(){!`;
    const jsOutro = `}).call(r);r.Elm.${runnerModuleName}.init({flags:''}).ports.toJs.subscribe(o);`;

    const elmRunnerCompiledReadable = createReadStream(elmRunnerCompiledPath);
    // $FlowFixMe
    const jsIntroReadable = Readable.from(jsIntro);
    // $FlowFixMe
    const jsOutroReadable = Readable.from(jsOutro);

    const proc = spawn("node");
    proc.stdout.pipe(process.stdout);
    if (isNodeStderr) proc.stderr.pipe(process.stderr);
    jsIntroReadable.pipe(proc.stdin, { end: false });
    jsIntroReadable.on("end", () => {
        elmRunnerCompiledReadable.pipe(proc.stdin, { end: false });
        elmRunnerCompiledReadable.on("end", () => {
            jsOutroReadable.pipe(proc.stdin);
        });
    });
}

export async function spawnNodeModulesData(
    mainOptions: T.MainOptions,
    modulesData: T.ModulesData
) {
    const { tmpDir, runnerModuleName } = mainOptions;
    const elmRunnerPath = `${tmpDir}/${runnerModuleName}.elm`;
    const elmRunnerCompiledPath = `${tmpDir}/${runnerModuleName}.js`;

    writeFileSync(
        elmRunnerPath,
        renderElmRunnerTemplate(runnerModuleName, modulesData)
    );
    spawnNodeElmPlatform(mainOptions, elmRunnerPath, elmRunnerCompiledPath);
}

export async function mainCli({
    mainOptions,
    varOptions,
    elmFiles
}: T.CliOpts) {
    const { isCachedRunner, cachedRunner } = mainOptions;
    if (isCachedRunner || cachedRunner) {
        spawnNodeElmPlatform(mainOptions, cachedRunner || undefined);
        return;
    }

    const {
        predefinedNoParse,
        isAll,
        predefined,
        prefixes,
        suffixes,
        regexpes
    } = varOptions;
    let modulesData: T.ModulesData;
    if (predefinedNoParse) {
        const { gatherModulesData } = await import("./modulesDataElmJson.mjs");
        modulesData = await gatherModulesData(elmFiles, predefinedNoParse);
    } else if (isAll || predefined || prefixes || suffixes || regexpes) {
        const { gatherModulesData, varNameExaminerFactory } = await import(
            "./modulesDataParse.mjs"
        );
        const varNameExaminer = varNameExaminerFactory(varOptions);
        modulesData = await gatherModulesData(elmFiles, varNameExaminer);
    }
    modulesData && spawnNodeModulesData(mainOptions, modulesData);
}
