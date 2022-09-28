import { SdImage } from '@sd-playground/shared-types';
import { getImageUrl } from './ImageList';

type SdImageCompProps = {
  image: SdImage;
  size: number;
};

export function SdImageComp(props: SdImageCompProps) {
  // des props
  const { image, size } = props;

  if (image === undefined) {
    return null;
  }

  return (
    <img
      src={getImageUrl(image.url)}
      style={{
        aspectRatio: 1,
        width: size,
        maxWidth: '100%',
      }}
    />
  );
}
