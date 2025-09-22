// src/types/app.ts

// export type UserRole = "ADMIN" | "MEMBER" | null;

export type CurrentUser = {
	id: string;
	email: string;
	fullName: string | null;
	isAdmin: boolean;
	position: string | null;
} | null;

// export type UserDataType = {
//     board_positions: {
//         name: string | null;
//         is_admin: boolean | null;
//     } | null;
//     profiles: {
//         first_name: string | null;
//         last_name: string | null;
//     } | null;
// }

// src/types/app.ts

export type UserProfile = {
  first_name: string | null;
  last_name: string | null;
};

export type BoardPosition = {
  name: string | null;
  is_admin: boolean | null;
};

export type UserData = {
  board_positions: BoardPosition | null;
  profiles: UserProfile | null;
};