import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "../../database";

/**
 * Returns a list of user IDs from a partial search input
 * For `resolveMentionSuggestions` in liveblocks.config.ts
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") as string;

  const filteredUsers = getAllUsers()
    .filter((user) => {
      if (!text) return true; // If no text is provided, return all users
      return user.info.name.toLowerCase().includes(text.toLowerCase());
    })

  return NextResponse.json(filteredUsers);
}
