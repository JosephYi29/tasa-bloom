// import { updateSession } from "@/lib/supabase/middleware";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	
	console.log("------- Running Supabase middleware");
	console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
	console.log(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY);


	const supabase = createMiddlewareClient({ req, res }, {
		supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
		supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
	});
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
