// @flow
export type Path = string;
export opaque type ElmFile: Path = Path;

export type ElmModuleName = string;
export type ElmVarName = string;

export type ElmFiles = ElmFile[];
export type ElmVarNames = ElmVarName[];
export type ModuleData = {|
    name: ElmModuleName,
    vars: ElmVarNames
|};
export type ModulesData = ModuleData[];

export type VarNameExaminer = string => boolean;

export type VarOptions = {|
    predefinedNoParse: ?(string[]),
    isAll: ?boolean,
    predefined: ?(string[]),
    prefixes: ?(string[]),
    suffixes: ?(string[]),
    regexpes: ?(string[])
|};

export type MainOptions = {|
    elmBin: Path,
    tmpDir: Path,
    runnerModuleName: string,
    isNodeStderr: ?boolean,
    isCachedRunner: ?boolean,
    cachedRunner: ?Path,
    isColorOutput: ?boolean
|};

export type CliOpts = {|
    mainOptions: MainOptions,
    elmFiles: ElmFiles,
    varOptions: VarOptions
|};
