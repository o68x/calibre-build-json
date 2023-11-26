// @ts-check

// Will get all images from the calibre directory

import { existsSync, readFileSync, writeFileSync } from "fs";

import Database from "better-sqlite3";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const coversDir = "./public/covers";
const datafile = "./public/metadata.json";
// @ts-ignore
const sourcedb = path.join(process.env.CALIBRE, "metadata.db");

// Check that we're in the right calibre directory with database
if (!existsSync(sourcedb)) {
  console.error("Quitting: no database found at", sourcedb);
  process.exit(1);
}

// Open metadata.json
const data = JSON.parse(readFileSync(datafile, "utf-8"));

function lastDataId() {
  // @ts-ignore
  return Math.max(...data.books.map((row) => row.id));
}

// Open db
const db = new Database(sourcedb, { readonly: true });

async function sourceBookIds() {
  const rows = db.prepare(`SELECT id FROM books`).all();
  return rows; // { id: 1000 }
}

async function lastDbId() {
  const rows = await sourceBookIds()
  // @ts-ignore
  return Math.max(...rows.map((row) => row.id));
}

const last = await lastDbId();
console.log(last);
console.log(lastDataId());

const getBook = db.prepare(/* sql */ `SELECT id,
		title,
		(SELECT json_group_array(json_object('id',authors.id, 'name', sort))
		  FROM authors
		  LEFT JOIN books_authors_link ON books_authors_link.author=authors.id
		  WHERE books_authors_link.book = books.id)
		as authors_json,
		(SELECT languages.lang_code
		  FROM languages
		  LEFT JOIN books_languages_link ON books_languages_link.lang_code=languages.id
		  WHERE books_languages_link.book = books.id)
		as language,
		(SELECT tags.name
		  FROM tags
		  LEFT JOIN books_tags_link ON books_tags_link.tag=tags.id
		  WHERE books_tags_link.book = books.id)
		as tags,
		(SELECT name
		  FROM series
		  LEFT JOIN books_series_link ON books_series_link.series=series.id
		  WHERE books_series_link.book = books.id)
		as series,
		series_index,
		(SELECT text
		  FROM comments
		  WHERE comments.book = books.id)
		as description,
		(SELECT format
		  FROM data
		  WHERE data.book = books.id)
		as format,
    timestamp,
		pubdate,
		path,
		has_cover,
		last_modified
		FROM books WHERE id=@id`);

    /**
     *
     * @param {Array<Number>} books
     */
const getBooks = (books) => {
  for (const book of books) {
    data.books.push(getBook.get({ id: book }));
  }
};

console.log(new Date(data.books[0].timestamp).toDateString());

// const res = getBook.get({ id: 1000 });
getBooks([5001]);

try {
  writeFileSync(datafile, JSON.stringify(data, null, 2), "utf-8");
} catch (error) {
  console.error(error);
}

db.close();
