// src/lib/utils.ts

import { CurrentUser, UserData } from "@/types/app";
import { createClient } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "";

export async function getCurrentUser(): Promise<CurrentUser> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	// Check for the permanent super admin account
	if (user.email === SUPER_ADMIN_EMAIL) {
		return {
			id: user.id,
			email: user.email!,
			fullName: "Super Admin",
			isAdmin: true,
			position: "Admin",
		};
	}

	// Find the currently active cohort
	const { data: activeCohort } = await supabase
		.from("cohorts")
		.select("id")
		.eq("is_active", true)
		.single();

	if (!activeCohort) {
		return {
			id: user.id,
			email: user.email!,
			fullName: user.email!,
			isAdmin: false,
			position: null,
		};
	}

	// Fetch the user's profile and board position for the active cohort
	const { data: userData } = await supabase
		.from("board_memberships")
		.select(
			`
      board_positions(name, is_admin),
      profiles(first_name, last_name)
    `
		)
		.eq("user_id", user.id)
		.eq("cohort_id", activeCohort.id)
		.single();

	if (!userData) {
		return {
			id: user.id,
			email: user.email!,
			fullName: user.email!,
			isAdmin: false,
			position: null,
		};
	}

	const { board_positions, profiles } = userData as unknown as UserData;

	const position = board_positions?.name || null;
	const fullName = profiles
		? `${profiles.first_name} ${profiles.last_name}`
		: user.email;
	const isAdmin = board_positions?.is_admin || false;

	return {
		id: user.id,
		email: user.email!,
		fullName: fullName!,
		position,
		isAdmin,
	};
}
