import { Button, Textarea, Title, useMantineTheme } from '@mantine/core';
import { useEffect, useState } from 'react';

import { pickTextColorBasedOnBgColorAdvanced } from './pickTextColorBasedOnBgColorAdvanced';

export interface PromptPart {
  text: string;
  label: BreakdownType;
}

type BreakdownType = 'main' | 'artist' | 'style' | 'makeItGood' | 'unknown';

export interface PromptBreakdown {
  parts: PromptPart[];
}

const sortOrder: BreakdownType[] = [
  'main',
  'artist',
  'style',
  'makeItGood',
  'unknown',
];

function getTextForBreakdown(breakdown: PromptBreakdown) {
  // sort based on type
  const sortedParts = [...breakdown.parts].sort((a, b) => {
    return sortOrder.indexOf(a.label) - sortOrder.indexOf(b.label);
  });
  return sortedParts.map((c) => c.text).join(', ');
}

export function getBreakdownForText(text: string): PromptBreakdown {
  const parts = text.split(',').map((c) => c.trim());
  const breakdown: PromptBreakdown = {
    parts: parts.map((c) => {
      return {
        text: c,
        label: 'unknown',
      };
    }),
  };
  return breakdown;
}

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

  const colorLookup = sortOrder.reduce((acc, type, i) => {
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
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}
