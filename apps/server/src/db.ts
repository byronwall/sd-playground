// file will communicate with the sqlite database
import { SdImage } from '@sd-playground/shared-types';
import * as fs from 'fs';
import { join } from 'path';
import { Database } from 'sqlite3';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connecting to database...', supabase);

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

function pushImagesIntoSupabase() {
  // one time thing to move current images into supabase

  console.log('pushing images into supabase');
  connectToDatabase();

  // get all images from sqlite
  db.all('SELECT * FROM images', (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach(async (row) => {
      const { data, error } = await supabase.from('images').insert(row);

      if (error) {
        console.log('error', error);
      }
      if (data) {
        console.log('data', data);
      }
    });
  });
}

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

      rows.forEach(convertSqliteToObj);
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
      convertSqliteToObj(row);
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

      rows.forEach(convertSqliteToObj);

      resolve(rows);
    });
  });
}

type SdImageSqlite = Omit<SdImage, 'promptBreakdown'> & {
  promptBreakdown: string;
};

function convertSqliteToObj(sqliteObj: SdImageSqlite) {
  sqliteObj.promptBreakdown = JSON.parse(sqliteObj.promptBreakdown);
}

export function db_insertImage(image: SdImage) {
  connectToDatabase();
  return new Promise((resolve, reject) => {
    db.run(
      `
    INSERT INTO images (id, promptBreakdown, seed, cfg, url, dateCreated, steps, groupId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        image.id,
        JSON.stringify(image.promptBreakdown),
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

// pushImagesIntoSupabase();
