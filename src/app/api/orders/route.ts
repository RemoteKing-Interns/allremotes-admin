import { NextRequest, NextResponse } from "next/server";
import { getDb, hasMongoUri } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const db = await getDb();
    const orders = await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({ orders });
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
    const orderData = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const db = await getDb();
    const result = await db.collection("orders").insertOne(orderData);
    
    return NextResponse.json({ success: true, id: result.insertedId, order: orderData });
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
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const db = await getDb();
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDataWithTimestamp }
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
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
