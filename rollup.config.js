import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "rollup-plugin-babel";
import multi from "rollup-plugin-multi-input";

const IS_PROD = process.env.NODE_ENV && process.env.NODE_ENV.startsWith("prod");

export default async () => {
    const babelFlowComments = babel({
        plugins: [
            "@babel/plugin-transform-flow-strip-types"
            // "@babel/plugin-transform-flow-comments"
        ]
    });

    const commentFlowTypes = IS_PROD && {
        preserveModules: true,
        input: "src/*.mjs",
        output: {
            dir: "src_esm",
            format: "esm",
            entryFileNames: "[name].mjs"
        },
        plugins: [multi(), babelFlowComments]
    };

    const bundleCommonJs = {
        inlineDynamicImports: true,
        input: "src/cli.mjs",
        output: {
            dir: "dist",
            format: "cjs",
            intro: "#!/usr/bin/env node",
            strict: false
        },
        plugins: [
            babelFlowComments,
            resolve({
                preferBuiltins: true
            }),
            commonjs(),
            IS_PROD &&
                (await import("rollup-plugin-terser")).terser({
                    mangle: true,
                    output: {
                        beautify: false
                    }
                })
        ]
    };

    return [bundleCommonJs, commentFlowTypes].filter(Boolean);
};
