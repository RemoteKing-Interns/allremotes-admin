import { NextRequest, NextResponse } from "next/server";
import { getDb, hasMongoUri } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const db = await getDb();
    const products = await db.collection("products").find({}).toArray();
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const body = await request.json();
    const db = await getDb();
    const result = await db.collection("products").insertOne(body);
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
