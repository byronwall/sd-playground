import { Button, Group, NumberInput, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';

import { api_generateImage } from '../model/api';

export function SdNewImagePrompt() {
  // store image props in state
  const [promptText, promptTextSet] = useState('');
  //cfg in state
  const [cfg, cfgSet] = useState(10);

  // steps
  const [steps, stepsSet] = useState(20);

  const onGen = () => {
    api_generateImage({
      prompt: promptText,
      cfg: cfg,
      steps: steps,
    });
  };

  return (
    <Stack>
      <h1>test a prompt</h1>
      <Group align={'flex-start'}>
        <Textarea
          label="prompt"
          value={promptText}
          onChange={(evt) => promptTextSet(evt.target.value)}
          style={{ minWidth: 400 }}
        />
        <NumberInput label="cfg" value={cfg} onChange={cfgSet} />
        <NumberInput label="steps" value={steps} onChange={stepsSet} />
        <Button onClick={() => onGen()}>Generate image</Button>
      </Group>
    </Stack>
  );
}
