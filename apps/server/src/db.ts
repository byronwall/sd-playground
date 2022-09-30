// file will communicate with the sqlite database
import { SdImage } from '@sd-playground/shared-types';
import * as fs from 'fs';
import { join } from 'path';
import { Database } from 'sqlite3';

// import path
// Open a SQLite database, stored in the file db.sqlite
let db: Database;

const err = (err: Error): void => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
};
const dbPath = 'db.sqlite';

function connectToDatabase() {
  db = new Database(dbPath, err);

  // create tables if needed
  createDbTables();
}

function createDbTables() {
  const schemaPath = join(__dirname, 'assets', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, err);
}

export function db_getAllImages() {
  connectToDatabase();

  return new Promise<SdImage[]>((resolve, reject) => {
    db.all('SELECT * FROM images', (err, rows) => {
      if (err) {
        reject(err);
      }

      resolve(rows);
    });
  });
}

export function db_getSingleImages(id: string) {
  connectToDatabase();

  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM images WHERE id=?', [id], (err, row) => {
      if (err) {
        reject(err);
      }

      console.log(row);
      resolve(row);
    });
  });
}
export function db_getImagesFromGroup(groupId: string) {
  connectToDatabase();

  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE groupId=?', [groupId], (err, rows) => {
      if (err) {
        reject(err);
      }

      resolve(rows);
    });
  });
}

export function db_insertImage(image: SdImage) {
  connectToDatabase();
  return new Promise((resolve, reject) => {
    db.run(
      `
    INSERT INTO images (id, prompt, seed, cfg, url, dateCreated, steps, groupId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        image.id,
        image.prompt,
        image.seed,
        image.cfg,
        image.url,
        image.dateCreated,
        image.steps,
        image.groupId,
      ],

      function (err) {
        if (err) {
          reject(err);
        }
        resolve(image);
      }
    );
  });
}
