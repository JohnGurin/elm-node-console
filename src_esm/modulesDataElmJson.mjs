import { readFileSync } from 'fs';
import { relative, isAbsolute } from 'path';

function subdirs(parent, target) {
  const rel = relative(parent, target);
  const isSubdir = rel && !rel.startsWith("..") && !isAbsolute(rel);
  return isSubdir ? rel.split(/[\\/]/g) : undefined;
}

function elmSourceDirs() {
  return JSON.parse(readFileSync("elm.json", "utf8"))["source-directories"];
}

function deriveElmModulesNames(elmSourceDirs, elmFiles) {
  return elmFiles.reduce((modules, file) => {
    let parts;
    elmSourceDirs.find(srcDir => {
      parts = subdirs(srcDir, file.replace(/\.elm$/, ""));
      return parts;
    });
    if (parts) modules.push(parts.join("."));else console.warn(`${file} is not in elm.json source-directories`);
    return modules;
  }, []);
}

async function gatherModulesData(elmFiles, predefinedVars) {
  const modules = deriveElmModulesNames(elmSourceDirs(), elmFiles);
  const modulesData = modules.reduce((acc, m) => {
    acc.push({
      name: m,
      vars: predefinedVars
    });
    return acc;
  }, []);
  return Promise.resolve(modulesData);
}

export { gatherModulesData };
