import {
  Card,
  Container,
  Grid,
  Group,
  HoverCard,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { SdImage } from '@sd-playground/shared-types';
import { useQuery } from 'react-query';

export function getImageUrl(imageUrl: string): string {
  return `http://localhost:3333/img/${imageUrl}`;
}

export function ImageList() {
  const { data, isLoading, isError, error } = useQuery('images', async () => {
    const res = await fetch('http://localhost:3333/api/images');
    const results = (await res.json()) as SdImage[];
    results.sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));
    return results;
  });

  console.log('data', data);

  return (
    <div>
      <h1>ImageList</h1>
      <div>
        {isLoading ? 'loading...' : ''}
        {isError ? 'error' : ''}
        <SimpleGrid cols={4}>
          {(data ?? []).map((img) => (
            <Card key={img.id}>
              <HoverCard>
                <HoverCard.Target>
                  <img
                    src={getImageUrl(img.url)}
                    style={{ aspectRatio: 1, maxWidth: '100%' }}
                  />
                </HoverCard.Target>

                <HoverCard.Dropdown>
                  <Container size="sm">
                    {/* dump all props of SdImage */}
                    <p>
                      <b> {img.prompt} </b>
                    </p>
                    <p> {img.id} </p>
                    <p>url: {img.url} </p>
                    <p>date: {img.dateCreated} </p>
                    <p> cfg: {img.cfg}</p>
                    <p>seed: {img.seed}</p>
                    <p>steps: {img.steps} </p>
                  </Container>
                </HoverCard.Dropdown>
              </HoverCard>
            </Card>
          ))}
        </SimpleGrid>
      </div>
    </div>
  );
}
