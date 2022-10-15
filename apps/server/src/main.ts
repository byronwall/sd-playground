/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

console.log('process.env', process.env);

import {
  getTextForBreakdown,
  getUuid,
  ImageGenRequest,
} from '@sd-playground/shared-types';
import * as cors from 'cors';
import * as express from 'express';
import { generateAsync } from 'stability-client';

import * as x from '../env.json';
import {
  db_getAllImages,
  db_getImagesFromGroup,
  db_getSingleImages,
  db_insertImage,
} from './db';
import { getImagesFromS3, uploadImageToS3 } from './s3_helpers';

const pathToImg = `/Users/byronwall/Projects/sd-playground/apps/server/ext`;

// this is a work around since .env was not working
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/images/:id', async (req, res) => {
  // load from db and return

  const id = (req.params as any).id;

  console.log('single image', id);

  const images = await db_getSingleImages(id);

  res.send(images);
});
app.get('/api/images/group/:id', async (req, res) => {
  // load from db and return

  const groupId = (req.params as any).id;

  console.log('group of  image', groupId);

  const images = await db_getImagesFromGroup(groupId);

  res.send(images);
});

app.get('/api/images', async (req, res) => {
  // load from db and return
  const images = await db_getAllImages();

  console.log('images found: ', images.length);

  res.send(images);
});

app.post('/api/img_gen', async (req, res) => {
  const imgGenReq: ImageGenRequest = req.body as ImageGenRequest;

  console.log('image gen req', imgGenReq);

  // send that prompt to the python CLI -- should really be a server

  const seed = imgGenReq.seed ?? Math.floor(Math.random() * 100000);
  const cfg = imgGenReq.cfg ?? 10;
  const steps = imgGenReq.steps ?? 20;
  const prompt = getTextForBreakdown(imgGenReq.promptBreakdown);
  const groupId = imgGenReq.groupId;
  const promptBreakdown = imgGenReq.promptBreakdown;

  try {
    const { images } = (await generateAsync({
      apiKey: x.STABILITY_KEY,
      seed,
      cfgScale: cfg,
      steps,
      prompt,
      height: 512,
      width: 512,
      samples: 1,
      outDir: pathToImg,
      debug: true,
      noStore: false,
    })) as any;

    if (images.length > 0) {
      const result = images[0];

      const fileKey = result.filePath.replace(pathToImg + '/', '');

      const s3res = await uploadImageToS3({
        filename: result.filePath,
        key: fileKey,
        mimetype: 'image/png',
      });

      // need to load to S3

      await db_insertImage({
        id: getUuid(),
        promptBreakdown,
        seed,
        cfg,
        steps,
        url: fileKey,
        dateCreated: new Date().toISOString(),
        groupId: groupId ?? getUuid(),
      });
    }

    res.send({ result: true });
  } catch (e: any) {
    console.log('error', e);
    res.send({ result: false });
  }
});

app.get('/img/:key', async (req, res) => {
  const key = (req.params as any).key;

  // load image from S3
  try {
    const s3res = await getImagesFromS3({ key });

    (s3res.Body as any).pipe(res);
  } catch (e: any) {
    console.log('error', e);
    res.status(500).send('error');
  }
});

const port = +process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
