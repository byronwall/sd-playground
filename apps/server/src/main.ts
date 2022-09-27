/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { getUuid, ImageGenRequest } from '@sd-playground/shared-types';
import { exec } from 'child_process';
import * as cors from 'cors';
import * as express from 'express';

import * as x from '../env.json';
import { db_getAllImages, db_insertImage } from './db';

const pathToImg = `/Users/byronwall/Projects/sd-playground/apps/server/ext`;

// this is a work around since .env was not working
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/images', async (req, res) => {
  // load from db and return
  const images = await db_getAllImages();

  console.log('images', images);

  res.send(images);
});

app.post('/api/img_gen', (req, res) => {
  const imgGenReq: ImageGenRequest = req.body as ImageGenRequest;

  console.log(imgGenReq);

  const { prompt } = imgGenReq;

  // send that prompt to the python CLI -- should really be a server

  const seed = Math.floor(Math.random() * 100000);
  const cfg = 10;
  const steps = 20;

  const cmd = `cd ${pathToImg} && STABILITY_KEY=${x.STABILITY_KEY} python3 -m stability_sdk.client -W 512 -H 512 -S ${seed} --cfg ${cfg} --steps ${steps} "${prompt}"`;

  const imgRegex = /wrote ARTIFACT_IMAGE to (.*?.png)/;

  const child = exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(+new Date(), `error: ${error.message}`);

      // match again regex

      return;
    }

    if (stderr) {
      const match = stderr.match(imgRegex);

      db_insertImage({
        id: getUuid(),
        prompt,
        seed,
        cfg,
        steps,
        url: match[1],
        dateCreated: new Date().toISOString(),
      });

      if (match) {
        res.send({ imageUrl: match[1] });
      }

      return;
    }

    console.log(`stdout:\n${stdout}`);
  });

  child.on('exit', () => {
    console.log(+new Date(), 'process completed -- go find the image?');
  });
});

// serve images using an absolute path (".." not allowed)
app.use('/img', express.static(pathToImg));

const port = +process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
