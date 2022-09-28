import { Button, Container, TextInput } from '@mantine/core';
import { ImageGenRequest, ImageGenResponse } from '@sd-playground/shared-types';
import axios from 'axios';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { ImageList } from '../components/ImageList';
import { SdNewImagePrompt } from '../components/SdNewImagePrompt';

export function Index() {
  const [promptText, promptTextSet] = useState(
    'dump truck by Alexander Jansson, cinematic shot, trending on artstation, high quality, brush stroke, hyperspace, vibrant colors'
  );

  const [data, dataSet] = useState<ImageGenResponse | undefined>({
    imageUrl:
      'generation-5fa765c2-36a2-4b13-8bc0-237c86d0f0e9:0-3c37dd06-0b16-48bb-b894-07b351bdfd70-0.png',
  });

  const queryClient = useQueryClient();

  const {
    isLoading,
    isError,
    error,
    mutate: onGen,
  } = useMutation(
    async () => {
      return await axios.post<ImageGenResponse, any, ImageGenRequest>(
        'http://localhost:3333/api/img_gen',
        { prompt: promptText }
      );
    },
    {
      onSuccess: (res) => {
        const result = {
          status: res.status + '-' + res.statusText,
          headers: res.headers,
          data: res.data as ImageGenResponse,
        };

        console.log(result);
        dataSet(result.data);

        // force list to reload
        queryClient.invalidateQueries(['images']);
      },
      onError: (err) => {
        console.log(err);
      },
    }
  );

  return (
    <Container size="lg">
      <SdNewImagePrompt />
      <div className="">
        <>
          {isLoading ? 'updating...' : ''}
          {isError ? 'error' : ''}
        </>
      </div>

      <ImageList />
    </Container>
  );
}

export default Index;
