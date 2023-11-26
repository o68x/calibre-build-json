import { readFileSync, writeFileSync } from "fs";

import OOC from "out-of-character";

export class Metadata {
  datafile;
  #file;
  #data;

  /**
   *
   * @param {String} datafile
   */
  constructor(datafile) {
    this.datafile = datafile;
    this.#file = readFileSync(this.datafile, "utf-8");
    this.#data = JSON.parse(this.#file);
  }

  get data() {
    return this.#data;
  }

  getLastIndex = () => {
    return Math.max(...this.#data.books.map((row) => row.id));
  }

  write() {
    try {
      //console.log(OOC);
      writeFileSync(this.datafile, OOC.replace(JSON.stringify(this.#data, null, 2)), "utf-8");
    } catch (error) {
      console.error(error);
    }
  }
}
