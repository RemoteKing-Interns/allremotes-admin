import { Suspense } from "react";
import StorefrontAdminApp from "@/components/storefront/storefront-admin-app";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
      <StorefrontAdminApp />
    </Suspense>
  );
}
