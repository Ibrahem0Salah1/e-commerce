import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  revalidateTag("categories", "max");
  revalidateTag("brands", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true, revalidated: ["categories","brands","products"] });
}
export async function POST() {
  revalidateTag("categories", "max");
  revalidateTag("brands", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
