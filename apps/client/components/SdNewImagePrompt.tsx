import {
  Button,
  Group,
  Loader,
  NumberInput,
  Stack,
  Title,
} from '@mantine/core';
import {
  getBreakdownForText,
  PromptBreakdown,
} from '@sd-playground/shared-types';
import { useState } from 'react';
import { useQueryClient } from 'react-query';

import { api_generateImage } from '../model/api';
import { PromptEditor } from './PromptEditor';

export function SdNewImagePrompt() {
  const [promptText, promptTextSet] = useState(
    'dump truck, poster art by Tomokazu Matsuyama, featured on pixiv, space art, 2d game art, cosmic horror, official art'
  );
  const [cfg, cfgSet] = useState(10);
  const [steps, stepsSet] = useState(20);

  const [seed, seedSet] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const [breakdown, setBreakdown] = useState<PromptBreakdown>(
    getBreakdownForText(promptText)
  );

  const queryClient = useQueryClient();

  const onGen = async () => {
    setIsLoading(true);
    await api_generateImage({
      promptBreakdown: breakdown,
      cfg: cfg,
      steps: steps,
      seed: seed,
    });
    setIsLoading(false);
    queryClient.invalidateQueries();
  };

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
