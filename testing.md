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
   Timestamp,First Name,Last Name,Personal Email,Phone Number,Year,Why do you want to join TASA?,Interview Video Link
   1/1/2026,Jane,Doe,jane@doe.com,123-456-7890,2026,"I love the culture!",https://drive.google.com/file/d/1234abc/view
   1/2/2026,John,Smith,john@smith.com,098-765-4321,2025,"I want to help plan Night Market.",https://drive.google.com/file/d/5678xyz/view
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

## 6. Test Admin Settings & Phase Locks (Phase 4)
Let's verify the admin oversight and cohort management tools.

1. As an admin, click **Cohorts** in the Admin sidebar.
2. **Current Cohort:** You should verify you see the active cohort you created earlier.
3. **Voting Phase Locks:** Toggle the **App Voting**, **Interview Voting**, and **Character Voting** switches to OFF (gray).
4. **Member UI Check:** Go to the regular **Vote** tab and click on a candidate's App, Interview, or Character page. You should see a red banner indicating voting is closed, and the score inputs/save buttons should be disabled.
5. Go back to Admin **Cohorts** and turn the switches back ON.
6. **Create a New Cohort:** Click **New Cohort**, select a term, type a year, and hit Create. It should appear in the list as inactive.
7. Activate the new cohort. The old one should automatically deactivate (triggering the database constraint). *Warning: This will change the active cohort for the whole app!* Switch back to your original active cohort when done.
8. **Board Management:** Click the **Board Members** tab in the Admin sidebar.
   * Add a registered user (e.g., yourself or a dummy account) to the board for the active cohort, assigning them a position (e.g., "President").
   * Verify they appear in the list.
9. **Oversight Dashboard:** Click **Oversight** in the Admin sidebar.
   * You should see progress bars for every board member in the active cohort.
   * If you submitted scores in Step 4, your progress bar should reflect the number of candidates you've rated versus the total number of candidates in the active cohort.

## 7. Test Scoring & Results Analytics (Phase 5)
Now, let's verify the automatic scoring engine and export features.

1. As an admin, click **Settings** in the Admin sidebar.
2. Under Settings, select the **Scoring Weights** card.
3. Test out the validation format by making the numbers sum to anything other than 100%, and notice that saving is disabled or presents an error.
4. Set the weights to **Application (40%)**, **Interview (35%)**, and **Character (25%)** or to your desired levels and hit **Save Settings**.
5. Set your **Outlier Threshold** (default is 2.0). 
6. Navigate to the **Results** tab in the Admin sidebar. 
7. Here you will see the full ranked list of candidates by their **Composite Score**. You can view how they scored via their categorized averages.
8. Click into any Candidate's name to view their **Candidate Details**. Look at the breakdowns for Application, Interview, and Character ratings. Notice how standard deviations inform the Adjusted Average to avoid extreme feedback outliers!
9. Back in the Results page, hit the **Export CSV** to safely download the results locally onto your computer in the `.csv` format.

## 8. Test Candidate Ordering (Feature)
As an admin, you have full control over how Candidates are presented to voters on the Voting Hub.

1. As an admin, click **Candidates** in the Admin sidebar.
2. Assuming you have Candidates loaded in the active cohort, note their current order.
3. Click the **Alphabetical** button to sort them by first name.
4. Click the **Randomize** button to shuffle the candidates wildly.
5. In addition to the auto-sorters, you can **Drag and Drop** any candidate row up and down the table using their left-side grip handle!
6. Click **Save Order**.
7. In the sidebar, click the main **Vote** link to head to the Voting Hub.
8. Notice that the candidate order now perfectly matches the custom configuration you just saved!
