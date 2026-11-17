import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { CommunityPost } from "@/types/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  return NextResponse.json({ communityPosts: db.communityPosts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.consentGranted) {
      return NextResponse.json(
        { error: "Explicit photography publication consent is required." },
        { status: 400 }
      );
    }

    const newPost: CommunityPost = {
      id: `comm-${Date.now()}`,
      username: body.username?.startsWith("@")
        ? body.username
        : `@${body.username || "anonymous"}`,
      customerName: body.customerName || "Community Member",
      location: body.location || "JAKARTA, ID",
      imageUrl: body.imageUrl || "/images/hero-campaign.png",
      caption: body.caption || "",
      productSlug: body.productSlug || "silent-riot-heavy-box-hoodie-black",
      productName:
        body.productName || "SILENT RIOT HEAVY BOX HOODIE — PITCH BLACK",
      aspectRatio: body.aspectRatio || "4:5",
      gridSpan: body.gridSpan || "standard",
      consentGranted: true,
      status: body.autoApprove ? "APPROVED" : "PENDING",
      createdAt: new Date().toISOString(),
    };

    const db = updateDb((state) => {
      state.communityPosts.unshift(newPost);
    });

    return NextResponse.json({
      ok: true,
      post: newPost,
      communityPosts: db.communityPosts,
    });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, deletePost, updatedPost } = body as {
      id: string;
      status?: "APPROVED" | "PENDING" | "REJECTED";
      deletePost?: boolean;
      updatedPost?: Partial<CommunityPost>;
    };

    const db = updateDb((state) => {
      if (deletePost) {
        state.communityPosts = state.communityPosts.filter((p) => p.id !== id);
        return;
      }
      const postIdx = state.communityPosts.findIndex((p) => p.id === id);
      if (postIdx !== -1) {
        if (status) {
          state.communityPosts[postIdx].status = status;
        }
        if (updatedPost) {
          state.communityPosts[postIdx] = {
            ...state.communityPosts[postIdx],
            ...updatedPost,
          };
        }
      }
    });

    return NextResponse.json({ ok: true, communityPosts: db.communityPosts });
  } catch {
    return NextResponse.json({ error: "Failed to moderate post" }, { status: 500 });
  }
}
