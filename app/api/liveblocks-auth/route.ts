import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { getRandomUser } from "../database";

/**
 * Authenticating your Liveblocks application
 * https://liveblocks.io/docs/authentication
 */

const liveblocks = new Liveblocks({
  secret: "sk_dev_TuK-OrvAU1zvur8oMO9BCaMlQ2p5p_bkNGgfc-NCNfZ3aTONZvB0z6QLMiHJKKou",
});

export async function POST(request: NextRequest) {
  // if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  //   return new NextResponse("Missing LIVEBLOCKS_SECRET_KEY", { status: 403 });
  // }

  // Get the current user's unique id and info from your database
  const userData = await request.json();

  // Create a session for the current user (access token auth)
  const session = liveblocks.prepareSession(`${userData.id}`, {
    userInfo: userData.info,
  });

  // Use a naming pattern to allow access to rooms with a wildcard
  session.allow(`liveblocks:drizz-canvas-editor:*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();

  return new NextResponse(body, { status });
}
