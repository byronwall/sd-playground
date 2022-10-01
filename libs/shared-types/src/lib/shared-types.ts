import { v4 as uuidv4 } from 'uuid';

export function sharedTypes(): string {
  return 'shared-types';
}

export interface SdImage {
  id: string;

  seed: number;
  cfg: number;
  steps: number;
  url: string;
  dateCreated: string;

  groupId: string;

  promptBreakdown: PromptBreakdown;
}

export type SdImagePlaceHolder = Partial<
  Omit<SdImage, 'id' | 'dateCreated' | 'url'>
> &
  Pick<SdImage, 'promptBreakdown'>;

export type ImageGenRequest = SdImagePlaceHolder;

export interface ImageGenResponse {
  imageUrl: string;
}

export function getUuid() {
  return uuidv4();
}

export interface PromptPart {
  text: string;
  label: BreakdownType;
}

export type BreakdownType = typeof PromptBreakdownSortOrder[number];

export interface PromptBreakdown {
  parts: PromptPart[];
}

export const PromptBreakdownSortOrder = [
  'main',
  'modifiers',
  'artist',
  'style',
  'makeItGood',
  'unknown',
] as const;

export function getTextForBreakdown(breakdown: PromptBreakdown) {
  // sort based on type
  const sortedParts = [...breakdown.parts].sort((a, b) => {
    return (
      PromptBreakdownSortOrder.indexOf(a.label) -
      PromptBreakdownSortOrder.indexOf(b.label)
    );
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
