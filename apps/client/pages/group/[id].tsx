import { ImageGrid } from 'apps/client/components/ImageGrid';
import { useRouter } from 'next/router';

export default function GroupPage() {
  const router = useRouter();
  const id = router.query.id as string;

  return (
    <div>
      <h1>Group {id}</h1>

      <ImageGrid groupId={id} />
    </div>
  );
}
