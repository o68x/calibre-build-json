// Will get all images from the calibre directory

import { existsSync, readdirSync, statSync } from 'fs';

import dotenv from 'dotenv';
import path from "path";
import sharp from 'sharp';

dotenv.config();

const coversDir = "./public/covers";
// @ts-ignore
const sourcedb = path.join(process.env.CALIBRE, "metadata.db");

// Check that we're in the right calibre directory with database
if (!existsSync(sourcedb)) {
  console.error("Quitting: no calibre database found at", sourcedb);
  process.exit(1);
}

// Check fetched (imported) images
if (!existsSync(coversDir)) {
  console.error("Quitting: wrong covers dir", coversDir);
  process.exit(1);
}

const getFiles = function(dirPath, arrayOfFiles) {
  let files = readdirSync(dirPath)
  let dirId = dirPath.match(/\((\d*)\)/) || 0;

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      if (file === "cover.jpg") {
        let img = path.join(dirPath, file);
        arrayOfFiles.push({id: parseInt(dirId[1]), cover: img})
      }
    }
  })

  return arrayOfFiles
}

const files = getFiles(process.env.CALIBRE);

console.log(files[100])

async function makefile(image) {
  try {
    if (Number.isInteger(image.id) && !existsSync(path.join(coversDir, `${image.id}.webp`))) {
      await sharp(image.cover).resize(200).toFormat("webp").toFile(path.join(coversDir, `${image.id}.webp`));
    } else {
      console.log(`${image.id} exists or is not a cover`);
    }
  } catch (err) {
    console.error(err);
  }
}

files.forEach(file => {
  makefile(file)
});
