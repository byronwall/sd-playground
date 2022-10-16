import { getImagesFromS3 } from 'apps/client/libs/s3_helpers';

export default async function handler(req, res) {
  console.log('api handled by next');
  const { key } = req.query;

  // load image from S3
  try {
    const s3res = await getImagesFromS3({ key });

    (s3res.Body as any).pipe(res);
  } catch (e: any) {
    console.log('error', e);
    res.status(500).send('error');
  }
}
