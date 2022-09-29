import { Button } from '@mantine/core';
import { SdImagePlaceHolder } from '@sd-playground/shared-types';

import { api_generateImage } from '../model/api';
import { useAppStore } from '../model/store';

type SdImagePlaceHolderCompProps = {
  size: number;
  placeholder: SdImagePlaceHolder;
};

export function SdImagePlaceHolderComp(props: SdImagePlaceHolderCompProps) {
  // des props
  const { placeholder, size } = props;

  const onIncrement = useAppStore((s) => s.incrementLoadCount);

  const handleClick = async () => {
    console.log('handleClick - gen image', placeholder);
    const img = await api_generateImage(placeholder);

    onIncrement();
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: 'lightgray',
      }}
    >
      <p>seed = {placeholder.seed} </p>
      <p>cfg = {placeholder.cfg}</p>
      <p>steps = {placeholder.steps}</p>

      <Button onClick={handleClick}>gen</Button>
    </div>
  );
}
