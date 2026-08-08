import { AuthForm } from '@/components/auth-form';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return <AuthForm returnTo={typeof returnTo === 'string' ? returnTo : '/'} />;
}
