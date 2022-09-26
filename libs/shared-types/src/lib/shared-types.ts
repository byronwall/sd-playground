export function sharedTypes(): string {
  return 'shared-types';
}

export interface ImageData {
  id: string;
  prompt: string;
  seed: number;
  cfg: number;
  steps: number;
}

export interface ImageGenRequest {
  prompt: string;
}

export interface ImageGenResponse {
  imageUrl: string;
}
