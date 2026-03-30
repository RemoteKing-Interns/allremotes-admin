import StorefrontLoginPage from "@/components/storefront/storefront-login-page";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return <StorefrontLoginPage nextPath={resolvedSearchParams.next} />;
}
