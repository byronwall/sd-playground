import { Button, Container, TextInput } from '@mantine/core';
import { ImageGenRequest, ImageGenResponse } from '@sd-playground/shared-types';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import { useMutation } from 'react-query';

export function Index() {
  const [promptText, promptTextSet] = useState(
    'dump truck by Alexander Jansson, cinematic shot, trending on artstation, high quality, brush stroke, hyperspace, vibrant colors'
  );

  const [data, dataSet] = useState<ImageGenResponse | undefined>({
    imageUrl:
      'generation-5fa765c2-36a2-4b13-8bc0-237c86d0f0e9:0-3c37dd06-0b16-48bb-b894-07b351bdfd70-0.png',
  });

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
      },
      onError: (err) => {
        console.log(err);
      },
    }
  );

  return (
    <Container size="lg">
      <h1>test a prompt</h1>
      <TextInput
        label="test"
        value={promptText}
        onChange={(evt) => promptTextSet(evt.target.value)}
      />
      <Button onClick={() => onGen()}>Generate image</Button>
      <div className="">
        <>
          {isLoading ? 'updating...' : ''}
          {isError ? 'error' : ''}
        </>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {data && (
        <img
          src={`http://localhost:3333/img/${data.imageUrl}`}
          height={512}
          width={512}
        />
      )}
    </Container>
  );
}

export default Index;
