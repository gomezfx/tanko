/// <reference types="node" />

export interface IZipEntry {
  entryName: string;
  isDirectory: boolean;
  getData(): Buffer;
}

export default class AdmZip {
  constructor(archivePath: string);
  getEntries(): IZipEntry[];
}
