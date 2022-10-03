import { Select } from '@mantine/core';

import { useAppStore } from '../model/store';
import { ImageTransformHolder } from '../model/transformers';

interface ImageTransformChooserProps {
  holder: ImageTransformHolder | undefined;
  onChange: (holder: ImageTransformHolder) => void;
}

export function ImageTransformChooser(props: ImageTransformChooserProps) {
  // des props
  const { holder, onChange } = props;

  const defaultTransformers = useAppStore((s) => s.transformHolders);

  const selectData = defaultTransformers.map((list) => list.name);

  const handleChange = (value: string) => {
    const newHolder = defaultTransformers.find((list) => list.name === value);
    if (newHolder) {
      onChange(newHolder);
    }
  };

  return (
    <Select
      value={holder?.name}
      data={selectData}
      onChange={handleChange}
      searchable
    />
  );
}
