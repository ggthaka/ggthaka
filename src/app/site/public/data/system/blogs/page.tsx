import { Page } from '@components/page';
import { PublicBlogs as PublicBlogsSection } from '@components/section';

export default function Blogs() {
  return <Page mainItems={<PublicBlogsSection />} />;
}
