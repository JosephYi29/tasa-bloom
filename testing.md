# TASA Bloom Testing Guide (Phases 1-3)

Here is a step-by-step guide to testing the app's current functionality, taking you from a fresh user to an admin managing candidate imports, to a board member voting.

## 1. Test Authentication & Admin Role
First, let's verify you can log in and that your Super Admin status works.

1. **Sign Up:** Go to `http://localhost:3000` (or 3001, depending on your terminal output). Click **Sign Up** on the new landing page.
2. **Create Account:** Enter an email and password.
   * **Important:** Use the exact email you set as `SUPER_ADMIN_EMAIL` in your `.env.local` to gain instant admin access.
3. **Admin Verification:** Upon logging in, you should see the dashboard. Because you are the Super Admin, the sidebar should show the **"Admin"** section with links to *Overview*, *Candidates*, *Import Data*, etc. (A regular user will not see these).

## 2. Test the Database Schema
Let's make sure the cohorts and traits are set up correctly.

1. Go to your local **Supabase Studio** at [http://127.0.0.1:54323](http://127.0.0.1:54323)
2. Go to the **Table Editor**.
3. **Activate a Cohort:** Check the `cohorts` table. Make sure you have at least one row where `is_active` is checked (`true`). (If it's empty, create a row for "Spring" "2026" and check `is_active`).
4. **Seed Character Traits:** Open the `character_traits` table. Add a few rows linked to your active `cohort_id`. For example:
   * Trait: `Overall Character`, Order: `1`, cohort_id: (your active cohort UUID)
   * Trait: `Drive`, Order: `2`, cohort_id: (your active cohort UUID)

## 3. Test the CSV Importer (Admin)
Now, test importing a Google Form export.

1. Create a dummy CSV file on your computer (or export a real one from Google Sheets). Example format:
   ```csv
   Timestamp,Full Name,Email,Why do you want to join TASA?,Interview Video Link
   1/1/2026,Jane Doe,jane@doe.com,"I love the culture!",https://drive.google.com/file/d/1234abc/view
   1/2/2026,John Smith,john@smith.com,"I want to help plan Night Market.",https://drive.google.com/file/d/5678xyz/view
   ```
2. In the app, click **Import Data** on the Admin sidebar.
3. Drag and drop your CSV file.
4. **Column Mapping:** The app will try to guess your columns.
   * Verify "Full Name" mapped to `Full Name (will split)`.
   * Verify "Email" mapped to `Email`.
   * Verify the "Why do you..." question mapped to `Application Question`.
   * Verify the "Interview Video Link" mapped to `Interview Video Link`.
5. Click **Preview Import**, then **Import Candidates**.
6. Check the **Candidates** sidebar tab to see Jane and John listed!

## 4. Test the Voting System (Board Member)
Now, experience the app as a voter.

1. Click **Vote** on the sidebar to go to the Voting Hub.
2. You should see cards for Jane Doe and John Smith. The status indicators (App, Interview, Character) should all be ⬜ (Not Started).
3. **Test Application Rating:** Click the **App** button for Jane.
   * You should see her answer to "Why do you want to join TASA?".
   * Enter a score (1-10) on the right. Hit **Save Scores**.
4. **Test Interview Rating:** Go back to the Voting Hub. The "App" indicator for Jane should now be ✅. Click **Interview**.
   * If you passed a valid google drive link (like the dummy CSV above), you will see an embedded video player.
   * Note: The embed only works if the Google Drive link is accessible/public.
5. **Test Character Rating:** Go back to the Hub, click **Character** for Jane.
   * You should see the traits you added to the database in Step 2.
   * Rate them 1-10 and hit **Save**.

## 5. Verify Database State
To confirm everything worked end-to-end:
1. Go back to your local Supabase Studio.
2. Check the `ratings` table. You should see records linking your `user_id` to `candidate_id`.
3. Check the `rating_scores` table. You should see your 1-10 scores securely stored.
