Outputs top level variables' values according to options.
`Elm 0.19.1`. Uses `Debug.toString`

## Instructions
```
$ elm-node-console
-b --elmBin             (default: elm)
-t --tmpDir             (default: elm-stuff)
-n --runnerModuleName           (default: NodeConsole_)
-e --isNodeStderr (?) output stderr of compiled js
-C --isCachedRunner (?) reuse elm runner file ($tmpDir)/($runnerModuleName).elm
-c --cachedRunner (?) reuse elm runner file, path
-q --isColorOutput

Which top level variables to select.
Each option (except isAll) is comma separated,
so commas can't be used in regexpes
-A --isAll
-w --predefinedNoParse (?) create elm runner without touching *.elm files
-l --predefined (?) exact variable names
-p --prefixes
-s --suffixes
-r --regexpes

 usage: elm-node-console -A t M1.elm M2.elm
        elm-node-console -s out,log M1.elm M2.elm
        All boolean options must be followed by some value if precede positional
        arguments (due to usage of simple cli parser)
```

## Code Runner
[Code Runner](https://github.com/formulahendry/vscode-code-runner) Visual Studio Code extension usage (`settings.json`):
```js
    "code-runner.executorMap": {
        "elm": "\"node_modules/.bin/elm-node-console\" -p out_ -s _out $fullFileName",
        // or
        "elm": "node node_modules/elm-node-console/dist/cli.js -A t $fullFileName",
    }
```
## Example
```elm
-- MyModule.elm
module MyModule exposing (..)

type Type1 = Type1 Int
fn1 (Type1 a) = Type1 (a + 10)

-- MyModuleOut.elm
module MyModuleOut exposing (..)
import MyModule as M

var1_out = M.fn1 (M.Type1 10)
var2_log = Just 3
var3 = "No output"
```
```
$ elm-node-console -s _out,_log MyModuleOut.elm
MyModuleOut.var1_out
Type1 20

MyModuleOut.var2_log
Just 3
```