import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "../../../../lib/s3Upload";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const folder = formData.get("folder") as string;

  if (!file || !folder) {
    return NextResponse.json({ error: "Nepilnīgi dati" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToS3(buffer, file.name, folder, file.type);

  return NextResponse.json({ url });
}