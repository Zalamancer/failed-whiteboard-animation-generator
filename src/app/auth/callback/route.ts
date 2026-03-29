import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_EMAILS = [
  "duruihsan@gmail.com",
  "tryproanimate@gmail.com",
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (
        user &&
        ALLOWED_EMAILS.includes(user.email?.toLowerCase() ?? "")
      ) {
        return NextResponse.redirect(`${origin}/editor`);
      }

      // Not whitelisted — sign out and bounce
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/?error=access-denied`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth-error`);
}
