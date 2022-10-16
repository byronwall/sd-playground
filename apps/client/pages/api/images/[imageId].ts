import { db_getSingleImages } from 'apps/client/libs/db';

export default async function handler(req, res) {
  const { imageId } = req.query;

  const images = await db_getSingleImages(imageId);

  res.send(images);
}
