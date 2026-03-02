import { Page } from '@components/page';
import { Blog as BlogSection } from '@components/section';

export default async function BlogBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <Page mainItems={<BlogSection slug={slug} />} />;
}
