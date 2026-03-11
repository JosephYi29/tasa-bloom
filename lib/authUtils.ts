// src/lib/utils.ts

import { BoardPosition, CurrentUser } from "@/types/app";
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

	// Fetch the user's board position for the active cohort
	const { data: membershipData } = await supabase
		.from("board_memberships")
		.select(`board_positions(name, is_admin)`)
		.eq("user_id", user.id)
		.eq("cohort_id", activeCohort.id)
		.single();

	if (!membershipData) {
		return {
			id: user.id,
			email: user.email!,
			fullName: user.email!,
			isAdmin: false,
			position: null,
		};
	}

	// Fetch the user's profile separately (profiles is linked via user_id, not via board_memberships)
	const { data: profileData } = await supabase
		.from("profiles")
		.select("first_name, last_name")
		.eq("user_id", user.id)
		.single();

	const board_positions = (membershipData as unknown as { board_positions: BoardPosition | null }).board_positions;

	const position = board_positions?.name || null;
	const fullName = profileData
		? `${profileData.first_name} ${profileData.last_name}`
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
