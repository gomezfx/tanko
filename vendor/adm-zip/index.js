/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync, spawnSync } = require("node:child_process");

class ZipEntry {
  constructor(archivePath, entryName) {
    this.archivePath = archivePath;
    this.entryName = entryName;
  }

  get isDirectory() {
    return this.entryName.endsWith("/");
  }

  getData() {
    const result = spawnSync("unzip", ["-p", this.archivePath, this.entryName]);

    if (result.status !== 0) {
      const message = result.stderr?.toString().trim() || `Exit code ${result.status}`;
      throw new Error(`Failed to extract ${this.entryName}: ${message}`);
    }

    return result.stdout;
  }
}

class AdmZip {
  constructor(archivePath) {
    this.archivePath = archivePath;
  }

  getEntries() {
    const output = execFileSync("unzip", ["-Z1", this.archivePath], { encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((entryName) => new ZipEntry(this.archivePath, entryName));
  }
}

module.exports = AdmZip;
module.exports.default = AdmZip;
module.exports.AdmZip = AdmZip;
module.exports.ZipEntry = ZipEntry;
