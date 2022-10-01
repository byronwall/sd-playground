import { SwitchProps as mSwitchProps, Switch as MSwitch } from '@mantine/core';
import { useCallback } from 'react';

type SwitchProps = Omit<mSwitchProps, 'onChange'> & {
  onChange: (value: boolean) => void;
};

export function Switch(props: SwitchProps) {
  const { onChange, ...rest } = props;

  const handleChange = useCallback(
    (evt) => onChange(evt.currentTarget.checked),
    [onChange]
  );

  return <MSwitch {...rest} onChange={handleChange} />;
}
