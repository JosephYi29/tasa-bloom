// import { updateSession } from "@/lib/supabase/middleware";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
 const supabase = createMiddlewareClient({ req, res });
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const publicPaths = ["/login", "/"];

	if (!session && !publicPaths.includes(req.nextUrl.pathname)) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	return res;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
