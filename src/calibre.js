import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";

export class Calibre {

  /**
   *
   * @param {String} dir
   */
  constructor(dir) {
    this.dir = dir;
  }

  init() {
    const sourcedb = path.join(this.dir, "metadata.db");
    if (!existsSync(sourcedb)) {
      console.error("Quitting: no database found at", sourcedb);
      process.exit(1);
    }
    try {
        this.db = new Database(sourcedb, { readonly: true })
      } catch(err) {
        console.log(err);
      }
  }

  /**
   *
   * @param {Number} index
   * @returns Array
   */
  async getIdsFrom(index = 0) {
    const rows = this.db.prepare(`SELECT id FROM books WHERE id > ?`).all(index);
    return rows; // { id: 1000 }
  }

  async getLastIndex() {
    const rows = await this.getIdsFrom();
    return Math.max(...rows.map((row) => row.id));
  }

  #getBookStmt = /* sql */ `SELECT id,
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
  FROM books WHERE id=@id`;

  /**
   *
   * @param {Array<Number>} books
   * @returns Array
   */
  getBooks = (books) => {
    const booksArr = [];
    for (const book of books) {
      booksArr.push(this.db.prepare(this.#getBookStmt).get({ id: book }));
    }
    return booksArr;
  };

}
