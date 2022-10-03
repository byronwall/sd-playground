import { v4 as uuidv4 } from 'uuid';
import * as cloneDeep from 'clone-deep';

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

export interface SdImageTransformNumberRaw {
  type: 'num-raw';
  field: 'seed' | 'cfg' | 'steps';
  value: number;
}

export interface SdImageTransformNumberDelta {
  type: 'num-delta';
  field: 'seed' | 'cfg' | 'steps';
  delta: number;
}

export interface SdImageTransformText {
  type: 'text';
  field: BreakdownType;
  action: 'add' | 'remove' | 'set';
  value: string | string[];
}

export type SdImageTransform =
  | SdImageTransformNumberRaw
  | SdImageTransformNumberDelta
  | SdImageTransformText;

export function generatePlaceholderForTransforms(
  baseImage: SdImage,
  transform: SdImageTransform[]
): SdImagePlaceHolder {
  const finalImage = transform.reduce((acc, cur) => {
    acc = generatePlaceholderForTransform(acc, cur);
    return acc;
  }, cloneDeep(baseImage));

  return finalImage;
}

export function generatePlaceholderForTransform(
  baseImage: SdImage,
  transform: SdImageTransform
): SdImagePlaceHolder {
  // deep copy the base image
  const placeholder = cloneDeep(baseImage);
  delete placeholder.id;
  delete placeholder.url;
  delete placeholder.dateCreated;

  switch (transform.type) {
    case 'num-raw':
      placeholder[transform.field] = transform.value;
      break;
    case 'num-delta':
      // TODO: apply a min/max
      placeholder[transform.field] += transform.delta;
      break;
    case 'text': {
      switch (transform.action) {
        case 'add': {
          const toAdd = Array.isArray(transform.value)
            ? transform.value
            : [transform.value];
          placeholder.promptBreakdown.parts.push(
            ...toAdd.map((c) => ({ text: c, label: transform.field }))
          );
          break;
        }

        case 'remove': {
          const toRemove = Array.isArray(transform.value)
            ? transform.value
            : [transform.value];

          placeholder.promptBreakdown.parts =
            placeholder.promptBreakdown.parts.filter((c) => {
              return !toRemove.includes(c.text) || c.label !== transform.field;
            });
          break;
        }
        case 'set': {
          const toSet = Array.isArray(transform.value)
            ? transform.value
            : [transform.value];

          placeholder.promptBreakdown.parts =
            placeholder.promptBreakdown.parts.filter(
              (c) => c.label !== transform.field
            );
          placeholder.promptBreakdown.parts.push(
            ...toSet.map((c) => ({ text: c, label: transform.field }))
          );

          break;
        }
      }
      break;
    }
  }
  return placeholder;
}
