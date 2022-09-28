import {
  ImageGenResponse,
  SdImagePlaceHolder,
} from '@sd-playground/shared-types';
import axios from 'axios';

export async function api_generateImage(image: SdImagePlaceHolder) {
  // hit the img_gen api
  const res = await axios.post('http://localhost:3333/api/img_gen', image);

  const img = res.data as ImageGenResponse;

  return img;
}
