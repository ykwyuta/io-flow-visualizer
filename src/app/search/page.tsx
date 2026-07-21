import { SearchView } from '@/features/search/SearchView';

// 検索はクライアントから API を叩くため動的
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  return <SearchView initialFocus={focus} />;
}
