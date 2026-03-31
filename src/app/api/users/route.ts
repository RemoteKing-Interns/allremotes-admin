import { NextRequest, NextResponse } from "next/server";
import { getDb, hasMongoUri } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    
    const db = await getDb();
    
    if (id) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
      return NextResponse.json({ user });
    } else if (email) {
      const user = await db.collection("users").findOne({ email });
      return NextResponse.json({ user });
    } else {
      const users = await db.collection("users").find({}).toArray();
      return NextResponse.json({ users });
    }
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
    const { email, password, ...userData } = body;
    
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const newUser = {
      email,
      password, // In production, this should be hashed
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection("users").insertOne(newUser);
    
    return NextResponse.json({ success: true, id: result.insertedId, user: newUser });
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
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const db = await getDb();
    const result = await db.collection("users").updateOne(
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
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
