// Will get all images from the calibre directory

import { existsSync, readdirSync, statSync } from "fs";

import path from "path";
import sharp from "sharp";

export class Covers {
  constructor(coversDir, calibreDir) {
    this.coversDir = coversDir;
    this.calibreDir = calibreDir;
  }

  writeCover = async (book) => {
    try {
      if (
        Number.isInteger(book.id) &&
        !existsSync(path.join(this.coversDir, `${book.id}.webp`))
      ) {
        await sharp(path.join(this.calibreDir, book.path, "cover.jpg"))
          .resize(100)
          .toFormat("webp")
          .toFile(path.join(this.coversDir, `${book.id}.webp`));
      } else {
        console.log(`${book.id} exists or is not a cover`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  getCovers = async (books) => {
    for (const book of books) {
      await this.writeCover(book);
    }
  };
}

const getFiles = function (dirPath, root, arrayOfFiles) {
  if (arguments.length === 1) root = dirPath;

  let files = readdirSync(dirPath);
  const regex = /\((\d*)\)/;
  let dirId = dirPath.match(regex) || 0;

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getFiles(dirPath + "/" + file, root, arrayOfFiles);
    } else {
      if (file === "cover.jpg") {
        // I have to do this because of the way paths are stored in calibre
        let img = path.relative(root, dirPath);
        arrayOfFiles.push({ id: parseInt(dirId[1]), path: img });
      }
    }
  });

  return arrayOfFiles;
};

const files = getFiles("D:/Olivier/Library");

const covers = new Covers("data/covers/", "D:/Olivier/Library");

covers.getCovers(files);
