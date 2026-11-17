import { NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import {
  Collection,
  ShippingAreaRate,
  SizeGuideMaster,
  StoreCMSConfig,
} from "@/types/store";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const db = updateDb((state) => {
      if (body.cms) {
        state.cms = {
          ...state.cms,
          ...(body.cms as Partial<StoreCMSConfig>),
        };
      }
      if (body.collections) {
        state.collections = body.collections as Collection[];
      }
      if (body.sizeGuideMasters) {
        state.sizeGuideMasters = body.sizeGuideMasters as SizeGuideMaster[];
      }
      if (body.shippingAreas) {
        state.shippingAreas = body.shippingAreas as ShippingAreaRate[];
      }
    });

    return NextResponse.json({
      ok: true,
      cms: db.cms,
      collections: db.collections,
      sizeGuideMasters: db.sizeGuideMasters,
      shippingAreas: db.shippingAreas,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update CMS config" }, { status: 500 });
  }
}
