// @flow
import * as T from "./TypesDomain.mjs";

function isWhiteSpace(s) {
    return /[ \n\r\t]/.test(s);
}

function init(varNameExaminer: T.VarNameExaminer) {
    function awaitNewLine(s) {
        if (s === "\n") feedSymbol = awaitVar;
    }

    function awaitWord(next, skip = isWhiteSpace) {
        return function(s: string) {
            if (skip(s)) return;
            word = s;
            feedSymbol = next;
        };
    }

    function accumulateWord(
        wordTester = s => true,
        next,
        stopper = isWhiteSpace
    ) {
        return function(s: string) {
            if (stopper(s)) {
                if (wordTester(word)) {
                    feedSymbol = next;
                } else return true;
            } else {
                word += s;
            }
        };
    }

    function saveExposing() {
        word.length > 0 && exposing.add(word);
        word = "";
    }

    function awaitClosingParen(s) {
        if (s === ")") {
            saveExposing();
            if (exposing.has('..')) {
                isExposing = varName => true
            }
            feedSymbol = awaitNewLine;
        } else if (s === ",") {
            saveExposing();
        } else if (!isWhiteSpace(s)) {
            word += s;
        }
    }

    function isOpeningParen(s) {
        if (word !== "(") return true;
        word = isWhiteSpace(s) ? "" : s;
        feedSymbol = awaitClosingParen;
    }

    function awaitVar(s) {
        if (s === "\n") return;
        if (isWhiteSpace(s)) {
            feedSymbol = awaitNewLine;
        } else {
            word = s;
            feedSymbol = accumulateVarName;
        }
    }

    function accumulateVarName(s) {
        if (isWhiteSpace(s)) {
            if (word === "type") {
                feedSymbol = awaitNewLine;
            } else {
                feedSymbol = awaitEqualSign;
            }
        } else {
            word += s;
        }
    }

    function awaitEqualSign(s) {
        if (isWhiteSpace(s)) return;
        if (s !== "=") {
            feedSymbol = awaitNewLine;
        } else {
            if (isExposing(word) && varNameExaminer(word))
                vars.push(word);
            feedSymbol = awaitNewLine;
        }
    }

    const begin = awaitWord(
        accumulateWord(
            w => w === "module",
            awaitWord(
                accumulateWord(w => {
                    moduleName = w;
                    return true;
                }, awaitWord(accumulateWord(w => w === "exposing", awaitWord(isOpeningParen))))
            )
        )
    );
    let feedSymbol = begin;
    let word: string = "";

    let moduleName: string = "";
    let exposing = new Set();
    const isExposing_ = varName => exposing.has(varName)
    let isExposing = isExposing_
    let vars: T.ElmVarNames = [];

    // API
    function reset() {
        feedSymbol = begin;
        word = "";

        moduleName = "";
        exposing = new Set();
        isExposing = isExposing_
        vars = [];
    }

    function feedChunk(chunk: string) {
        for (let i = 0; i < chunk.length; ++i) {
            if (feedSymbol(chunk[i])) return true;
        }
    }

    function getResults(): ?T.ModuleData {
        if (moduleName && vars.length > 0)
            return {
                name: moduleName,
                vars: vars.slice()
            };
    }

    return {
        reset,
        feedSymbol,
        feedChunk,
        getResults
    };
}

export default init;
