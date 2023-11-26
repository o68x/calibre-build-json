import { Calibre } from "./calibre.js";
import Conf from 'conf';
import { Metadata } from "./metadata.js";

const config = new Conf({
  projectName: "calibre-build-json",
  cwd: ".",
  schema: {
    datafile: {
      default: "./data/metadata.json",
      type: "string"
    },
    calibreDir: {
      default: "D:/Olivier/Library",
      type: "string"
    }
  }
});

const metadata = new Metadata(config.get("datafile"));
const db = new Calibre(config.get("calibreDir"));
db.init();

const updateMetadata = async () => {
  // Quit if no new books
  if (!await dbHasNewBooks()) {
    console.log("No new books to add...");
    return;
  }

  // List indexes of books to add
  const booksToAdd = await db.getIdsFrom(metadata.getLastIndex())

  // Get new book objects
  const newBooks = await db.getBooks(booksToAdd.map(book => book.id))

  // Push books to metadata

  metadata.data.books.push(...newBooks);
  console.log(metadata.data.books[metadata.data.books.length - 1])

  metadata.write()

  // TODO: Add missing covers
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

updateMetadata()
