import {
  getTextForBreakdown,
  getUuid,
  ImageGenRequest,
  SdImage,
} from '@sd-playground/shared-types';
import { db_insertImage } from 'apps/client/libs/db';
import { uploadImageToS3 } from 'apps/client/libs/s3_helpers';
import { generateAsync } from 'stability-client';

const pathToImg = `.`;

export default async function handler(req, res) {
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
      apiKey: process.env.STABILITY_KEY,
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

      const imgResult: SdImage = {
        id: getUuid(),
        promptBreakdown,
        seed,
        cfg,
        steps,
        url: fileKey,
        dateCreated: new Date().toISOString(),
        groupId: groupId ?? getUuid(),
      };
      // need to load to S3

      await db_insertImage(imgResult);

      res.send(imgResult);
      return;
    }

    res.send({ result: true });
  } catch (e: any) {
    console.log('error', e);
    res.send({ result: false });
  }
}
