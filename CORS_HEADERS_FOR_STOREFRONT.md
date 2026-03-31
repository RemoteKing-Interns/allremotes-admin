# CORS Headers Required for Storefront API Routes

These CORS headers need to be added to each API route in the storefront project (allremotes.vercel.app) to allow the admin site (allremotes-admin.vercel.app) to make cross-origin requests.

## Required Headers

Add these headers to every API route response:

```typescript
headers: {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

## OPTIONS Handler

Add this OPTIONS handler to each API route for preflight requests:

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## API Routes That Need CORS

Based on the admin site API calls, these storefront routes need CORS headers:

### Core Data Routes
1. `/api/products` (GET, PUT, DELETE)
2. `/api/orders` (GET, PATCH)
3. `/api/users` (GET, POST, PUT, DELETE)
4. `/api/content` (GET, PUT)

### Admin-Specific Routes
5. `/api/admin/products` (PUT)
6. `/api/admin/reset` (POST)
7. `/api/admin/upload-products/template.csv` (GET)
8. `/api/admin/upload-products` (POST)
9. `/api/admin/s3` (GET)
10. `/api/admin/s3/upload` (POST)

### Additional Routes
11. `/api/reviews/[id]` (DELETE)

## Example Implementation

Here's how to modify an existing route like `/api/products/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Your existing GET logic
    const data = await getProducts();
    
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

export async function POST() {
  try {
    // Your existing POST logic
    const result = await createProduct(await request.json());
    
    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## Important Notes

1. **All responses must include CORS headers** - including error responses
2. **OPTIONS handler is required** for preflight requests
3. **Origin must be exact** - `https://allremotes-admin.vercel.app` (not wildcard)
4. **Methods should include all HTTP methods** the route supports
5. **Headers should include Content-Type** for JSON requests

After adding these headers to all the storefront API routes, the admin site will be able to make cross-origin requests successfully.
