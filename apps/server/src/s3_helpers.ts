import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as env_json from '../env.json';

const s3 = new S3Client({
  region: env_json.AWS_REGION,
  credentials: {
    accessKeyId: env_json.AWS_ACCESS_KEY_ID,
    secretAccessKey: env_json.AWS_SECRET_ACCESS_KEY,
  },
});

export interface FileUploadS3 {
  filename: string;
  key: string;
  mimetype: string;
}

export interface FileDownloadS3 {
  key: string;
}

export async function uploadImageToS3(file: FileUploadS3) {
  const fileStream = fs.createReadStream(file.filename);

  // upload image to s3
  const params = {
    Bucket: env_json.AWS_BUCKET_NAME,
    Key: file.key,
    Body: fileStream,
  };

  const command = new PutObjectCommand(params);

  await s3.send(command);
}

export async function getImagesFromS3(file: FileDownloadS3) {
  // get images from s3
  const downloadParams = {
    Key: file.key,
    Bucket: env_json.AWS_BUCKET_NAME,
  };

  const command = new GetObjectCommand(downloadParams);
  const data = await s3.send(command);

  return data;
}
