import {
  Button,
  Group,
  Loader,
  NumberInput,
  Stack,
  Textarea,
  Title,
} from '@mantine/core';
import { useState } from 'react';

import { api_generateImage } from '../model/api';
import {
  getBreakdownForText,
  PromptBreakdown,
  PromptEditor,
} from './PromptEditor';

export function SdNewImagePrompt() {
  const [promptText, promptTextSet] = useState(
    'dump truck, poster art by Tomokazu Matsuyama, featured on pixiv, space art, 2d game art, cosmic horror, official art'
  );
  const [cfg, cfgSet] = useState(10);
  const [steps, stepsSet] = useState(20);

  const [seed, seedSet] = useState(0);

  // isloading
  const [isLoading, setIsLoading] = useState(false);

  const onGen = async () => {
    setIsLoading(true);
    await api_generateImage({
      prompt: promptText,
      cfg: cfg,
      steps: steps,
      seed: seed,
    });
    setIsLoading(false);
  };

  // store  abreakdonw in state
  const [breakdown, setBreakdown] = useState<PromptBreakdown>(
    getBreakdownForText(promptText)
  );

  return (
    <Stack>
      <Title order={1}>test a prompt</Title>
      <PromptEditor
        initialBreakdown={breakdown}
        onBreakdownChange={setBreakdown}
        style={{ minWidth: 400 }}
      />

      <Group align={'flex-start'}>
        <NumberInput label="cfg" value={cfg} onChange={cfgSet} />
        <NumberInput label="steps" value={steps} onChange={stepsSet} />
        <NumberInput label="seed" value={seed} onChange={seedSet} />
        {isLoading ? (
          <Loader />
        ) : (
          <Button onClick={() => onGen()}>Generate image</Button>
        )}
      </Group>
    </Stack>
  );
}
