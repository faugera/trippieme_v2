import { AuthForm } from '@/components/auth-form';

export default async function AuthPage({
  searchParams,
}: PageProps<'/auth'>) {
  const { returnTo } = await searchParams;
  return <AuthForm returnTo={typeof returnTo === 'string' ? returnTo : '/'} />;
}
