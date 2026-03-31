# MongoDB Driver Fix for Storefront

## Error
```
{"error":"Failed to load products","details":"(0 , v.Kq) is not a function"}
```

## Root Cause
MongoDB driver version incompatibility with `.project()` method syntax.

## Fix Options

### Option 1: Remove .project() Method
Replace this in all API routes:
```typescript
// OLD (causing error)
products = await col.find({}).project({ _id: 0 }).toArray();

// NEW (compatible)
products = await col.find({}).toArray();
```

### Option 2: Use Aggregation Pipeline
```typescript
// Alternative compatible syntax
products = await col.aggregate([
  { $project: { _id: 0 } }
]).toArray();
```

### Option 3: Update MongoDB Driver
Update package.json to use compatible MongoDB driver version:
```json
{
  "dependencies": {
    "mongodb": "^4.17.0"
  }
}
```

## Files to Fix
- `/src/app/api/products/route.ts`
- `/src/app/api/orders/route.ts`
- `/src/app/api/users/route.js`

## Quick Fix
Replace all `.project({ _id: 0 })` with just `.toArray()` and handle _id removal in the admin site normalization functions.
