import "server-only";
import { redirect } from "next/navigation";
import { getViewer, type Viewer } from "./server";
import type { MemberRow } from "./database.types";

/** For signed-in pages: sends visitors to sign in, and new accounts to set up their profile first. */
export async function requireMember(path: string): Promise<Viewer & { member: MemberRow }> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  if (!viewer.member) redirect("/onboarding");
  return viewer as Viewer & { member: MemberRow };
}
