import { Suspense } from "react";
import StorefrontAdminApp from "@/components/storefront/storefront-admin-app";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
      <StorefrontAdminApp slug={slug} />
    </Suspense>
  );
}
