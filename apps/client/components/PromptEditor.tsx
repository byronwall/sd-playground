import { Button, Group, Textarea, Title, useMantineTheme } from '@mantine/core';
import {
  PromptBreakdown,
  BreakdownType,
  PromptBreakdownSortOrder,
  getTextForBreakdown,
  getBreakdownForText,
} from '@sd-playground/shared-types';
import { useEffect, useState } from 'react';

import { HoverPopover } from './HoverPopover';
import { pickTextColorBasedOnBgColorAdvanced } from './pickTextColorBasedOnBgColorAdvanced';

interface PromptEditorProps {
  //   initialPrompt?: string;
  //   onPromptChange: (newPrompt: string) => void;

  onBreakdownChange?: (newBreakdown: PromptBreakdown) => void;
  initialBreakdown?: PromptBreakdown;

  style?: React.CSSProperties;
}

// array of 10 unique colors as hex values

function useControlledUncontrolled<T>(
  initialValue: T,
  onChange: (newPrompt: T) => void,
  defaultValue: T
) {
  const [prompt, setPrompt] = useState<T>(initialValue ?? defaultValue);

  // push a change in the props into state
  useEffect(() => {
    setPrompt(initialValue);
  }, [initialValue]);

  // communicate a change in state back to the props
  useEffect(() => {
    onChange(prompt);
  }, [prompt, onChange]);

  return [prompt, setPrompt] as const;
}

export function PromptEditor(props: PromptEditorProps) {
  const {
    // initialPrompt,
    // onPromptChange,
    initialBreakdown,
    onBreakdownChange,
    ...rest
  } = props;

  // controlled and uncontrolled updates
  const [prompt, setPrompt] = useControlledUncontrolled(
    initialBreakdown,
    onBreakdownChange,
    undefined
  );

  const theme = useMantineTheme();

  // color names from open-colors
  const colorKeys = [
    'red',
    'pink',
    'grape',
    'violet',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
  ];

  const colorLookup = PromptBreakdownSortOrder.reduce((acc, type, i) => {
    const key = colorKeys[i];
    acc[type] = i; //theme.colors[key][9];
    return acc;
  }, {} as Record<string, number>);

  const simpleText = getTextForBreakdown(prompt);

  const handleRawTextChange = (newText: string) => {
    const newBreakdown = getBreakdownForText(newText);
    setPrompt(newBreakdown);
  };

  const handleChunkRemove = (index: number) => {
    const newParts = [...prompt.parts];
    newParts.splice(index, 1);
    setPrompt({
      parts: newParts,
    });
  };

  const handlePromptReorder = () => {
    const text = getTextForBreakdown(prompt);
    const newBreakdown = getBreakdownForText(text);

    // prev hash
    const prevHash = prompt.parts.reduce((acc, c) => {
      acc[c.text] = c.label;
      return acc;
    }, {} as Record<string, string>);

    // apply hash to new breakdown
    newBreakdown.parts.forEach((c) => {
      c.label = prevHash[c.text] as BreakdownType;
    });

    setPrompt(newBreakdown);
  };

  return (
    <div {...rest}>
      <Title order={2}>prompt editor</Title>
      {/* switch for isFancy */}
      <Textarea
        label="prompt"
        value={simpleText}
        onChange={(evt) => handleRawTextChange(evt.target.value)}
        style={{ minWidth: 400 }}
      />
      <div>
        <div>
          <Button onClick={handlePromptReorder}>reorder</Button>
        </div>
        {prompt.parts.map((part, idx) => {
          const chunk = part.text;
          const colorIndex = colorLookup[part.label];
          const colorName = colorKeys[colorIndex];
          const backgroundColor = theme.colors[colorName][9];
          const textColor = pickTextColorBasedOnBgColorAdvanced(
            backgroundColor,
            '#fff',
            '#000'
          );
          return (
            <>
              <div
                key={idx}
                style={{
                  backgroundColor,
                  color: textColor,
                  padding: 4,
                  borderRadius: 4,
                  margin: 4,
                  fontSize: 16,
                  display: 'inline-flex',
                  gap: 4,
                }}
              >
                <span>{chunk} </span>

                <Button
                  onClick={() => handleChunkRemove(idx)}
                  compact
                  color={colorName}
                  variant="outline"
                >
                  x
                </Button>

                <HoverPopover color={colorName}>
                  {/* button per type */}
                  <Group>
                    {PromptBreakdownSortOrder.map((type) => {
                      const colorIndex = colorLookup[type];
                      const colorName = colorKeys[colorIndex];
                      return (
                        <Button
                          key={type}
                          onClick={() => {
                            const newParts = [...prompt.parts];
                            newParts[idx].label = type;
                            setPrompt({
                              parts: newParts,
                            });
                          }}
                          color={colorName}
                          variant={part.label === type ? 'filled' : 'outline'}
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </Group>
                </HoverPopover>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}
