import { db_getImagesFromGroup } from 'apps/client/libs/db';

export default async function handler(req, res) {
  const { groupId } = req.query;

  console.log('group of  image', groupId);

  const images = await db_getImagesFromGroup(groupId);

  res.send(images);
}
