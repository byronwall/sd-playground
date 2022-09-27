import { v4 as uuidv4 } from 'uuid';

export function sharedTypes(): string {
  return 'shared-types';
}

export interface SdImage {
  id: string;
  prompt: string;
  seed: number;
  cfg: number;
  steps: number;
  url: string;
  dateCreated: string;
}

export interface ImageGenRequest {
  prompt: string;
}

export interface ImageGenResponse {
  imageUrl: string;
}

export function getUuid() {
  return uuidv4();
}
