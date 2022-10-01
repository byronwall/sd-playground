import { Container } from '@mantine/core';

import { ImageList } from '../components/ImageList';
import { SdNewImagePrompt } from '../components/SdNewImagePrompt';

export function Index() {
  return (
    <Container size="lg">
      <SdNewImagePrompt />

      <ImageList />
    </Container>
  );
}

export default Index;
