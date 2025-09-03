#!/usr/bin/env node

import { CleanOptions, simpleGit } from "simple-git";

import { Calibre } from "./calibre.js";
import Conf from 'conf';
import { Covers } from "./covers.js";
import { Metadata } from "./metadata.js";

simpleGit().clean(CleanOptions.DRY_RUN);

const git = simpleGit();

const config = new Conf({
  configName: "calibre-build",
  projectName: "calibre-build-json",
  cwd: ".",
  schema: {
    datafile: {
      default: "./metadata.json",
      type: "string"
    },
    coversDir: {
      default: "./covers",
      type: "string"
    },
    calibreDir: {
      default: "/home/olivier/Documens/Library",
      type: "string"
    }
  }
});

const dataFile = config.get("datafile");
const calibreDir = config.get("calibreDir");
const coversDir = config.get("coversDir")

const metadata = new Metadata(dataFile);
const db = new Calibre(calibreDir);
db.init();

const updateMetadata = async () => {

  let lastUpdate = new Date(metadata.data.lastUpdate);

  console.log(`Last update: ${lastUpdate.toLocaleString()}`);
  if (!await dbHasNewBooks()) {
    console.log("No new books to add...");
    return;
  }

  // List indexes of books to add
  const booksToAdd = await db.getIdsFrom(metadata.getLastIndex())

  // Get new book objects
  const newBooks = await db.getBooks(booksToAdd.map(book => book.id))

  console.log(newBooks.length, "new books");
  newBooks.forEach( book => {
    console.log(book.title);
  })
  // Push books to metadata

  metadata.data.books.push(...newBooks);
  metadata.data.lastUpdate = new Date();
  // console.log(metadata.data.books[metadata.data.books.length - 1])

  metadata.write()

  const covers = new Covers(coversDir, calibreDir);

  await covers.getCovers(newBooks)
}

/**
 *
 * @returns Bool
 */
async function dbHasNewBooks() {
  const lastDbIndex = await db.getLastIndex();
  const lastDataIndex = metadata.getLastIndex();

  return lastDbIndex > lastDataIndex ? true : false;
}

async function commitAndPush() {
  await git.add([dataFile, coversDir]);

  await git.commit("update data");

  await git.push()

  // console.log(await git.status());
}

async function run() {
  await updateMetadata();
  await commitAndPush();
}

run();
