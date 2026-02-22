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
7. **Test Editing a Candidate:** Click **Edit** next to Jane's name. Change her "Year" to `2027` and save. The UI should instantly reflect this change.
8. **Test Deleting a Candidate:** Click **Delete** next to John's name. Follow the red destructive prompts to confirm. He should disappear from the candidate grid!

## 4. Test the Voting System (Board Member)
Now, experience the app as a voter.

1. Click **Vote** on the sidebar to go to the Voting Hub.
2. You should see cards for Jane Doe and John Smith. The status indicators (App, Interview, Character) should all be ⬜ (Not Started).
3. **Test Application Rating:** Click the **App** button for Jane.
   * You should see her answer to "Why do you want to join TASA?".
   * Enter a score (1-10) on the right. Hit **Submit Final Rating**.
   * **Test Submission Lock:** An "Are you sure?" modal should appear preventing immediate submission. Click cancel, verify no changes happened. Click submit again, confirm, and verify the scores save!
4. **Test Interview Rating:** Go back to the Voting Hub. The "App" indicator for Jane should now be ✅. Click **Interview**.
   * If you passed a valid google drive link (like the dummy CSV above), you will see an embedded video player.
   * Note: The embed only works if the Google Drive link is accessible/public.
   * Give a score and trigger the submission confirmation modal.
5. **Test Character Rating:** Go back to the Hub, click **Character** for Jane.
   * You should see the traits you added to the database in Step 2.
   * Rate them 1-10, trigger the submission modal, and hit **Confirm Submission**.
   * **Test Abstain:** Alternatively, test the "Abstain from Evaluation" button on another candidate. Verify it completes the ballot without recording a score of 0.

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
9. **Test Application Questions:** Click **Settings** > **Application Questions**. Add new sample questions for the Application and Interview tabs. Verify they show up on the Voting Hub when rating candidates.
10. **Oversight Dashboard:** Click **Overview** in the Admin sidebar.
   * You should see a progress tracking table for all board members in the active cohort.
   * If you submitted scores in Step 4, your counts should reflect the number of candidates you've rated versus the total number of candidates in the active cohort (color coded yellow or green).

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
6. Click the **Remap Numbers** button. This will sequentially overwrite all Candidate Numbers from 1 to N based on the current visual order in the table, resolving any gaps or unordered numbering.
7. Click **Save Order**.
8. In the sidebar, click the main **Vote** link to head to the Voting Hub.
9. Notice that the candidate order now perfectly matches the custom configuration you just saved!

## 9. Test Candidate Active/Inactive Toggle (Feature)
As an admin, you can toggle candidates on/off instead of deleting them. Inactive candidates are hidden from voters and excluded from scoring.

1. As an admin, click **Candidates** in the Admin sidebar.
2. You should see an **eye icon** column next to each candidate's drag handle.
3. **Toggle Individual Candidate:** Click the eye icon on any candidate. The icon changes to a crossed-out eye and the row dims to 40% opacity, indicating the candidate is inactive.
4. **Toggle All:** At the top toolbar, click the **Deactivate All** button (appears when all candidates are active). All rows should dim. The button changes to **Activate All** — click it to re-enable everyone.
5. **Verify Voter Exclusion:** With one or more candidates deactivated, click the main **Vote** link in the sidebar. The deactivated candidates should NOT appear in the Voting Hub grid.
6. **Verify Results Exclusion:** As an admin, go to **Results**. Deactivated candidates should not appear in the leaderboard or scoring calculations.
7. **Verify Admin Dashboard Count:** Go to the admin **Overview** page. The candidate count card should only reflect active candidates.
8. **Re-activate:** Go back to **Candidates**, click the crossed-out eye icon to re-enable any deactivated candidates. Verify they reappear in the Voting Hub.

## 10. Test Board Position Management (Feature)
As an admin, you can add new board positions and toggle existing ones active/inactive from Settings.

1. As an admin, click **Settings** in the Admin sidebar.
2. You should see a **Board Positions** tile. Click it.
3. **View Positions:** The page at `/protected/admin/settings/positions` should list all board positions with toggle switches. Active positions appear in the top section, inactive ones (if any) appear in a dimmed lower section.
4. **Toggle a Position Off:** Flip the toggle switch on any position (e.g., "Webmaster"). It should move to the "Inactive Positions" section with dimmed styling.
5. **Verify Assignment Dropdown:** Go to **Board Members** in the Admin sidebar. Click **Add Member**. The position dropdown should NOT include the position you just deactivated.
6. **Add a New Position:** Go back to **Settings** > **Board Positions**. In the input at the bottom, type a new position name (e.g., "Tech Lead") and click **Add Position**. It should appear in the active list.
7. **Toggle Back On:** Flip an inactive position's toggle back on. It should return to the active section and reappear in the assignment dropdown.

## 11. Test Board Member Availability Toggle (Feature)
As an admin, you can toggle individual board members as available/unavailable. Unavailable members remain on the board but are excluded from voting progress counts.

1. As an admin, click **Board Members** in the Admin sidebar.
2. You should see an **Available** column with toggle switches for each member.
3. **Toggle a Member Unavailable:** Flip a toggle to "No". The member's row should dim and the label should change to "No".
4. **Verify Voting Progress Exclusion:** Go to the admin **Overview** page. The Board Member Voting Progress table should NOT include the unavailable member.
5. **Verify Oversight Exclusion:** Go to **Oversight** in the Admin sidebar. The unavailable member should NOT have a progress card.
6. **Re-enable:** Go back to **Board Members** and flip the toggle back to "Yes". The member should reappear in voting progress views.

## 12. Test Question Scorable Toggle (Feature)
Admins can mark application/interview questions as non-scorable (info-only) so they don't appear during voting.

1. As an admin, go to **Settings** → **Application Questions**.
2. Each question row should have a **Score** toggle switch on the right.
3. **Toggle Off:** Flip the toggle off for an info-only question (e.g., "What extracurriculars are you in?"). The row should dim and show an **"Info Only"** badge.
4. **Verify Voting View:** As a voter, open a candidate's Application rating page. The non-scorable question should be **completely hidden** — no response text, no score input.
5. **Verify Interview Tab:** Switch to the Interview tab in Settings and repeat. Non-scorable interview questions should also be hidden from the Interview voting page.
6. **Re-enable:** Toggle the question back on. It should reappear in the voting view with a score input.

## 13. Test Legacy Import Question Mapping (Feature)
When importing legacy voting data, admins can map each score column to an existing question or trait instead of auto-creating new ones.

1. As an admin, go to **Import Candidates**.
2. Scroll to **Historical Voting Data** section. Select a rating phase (Application/Interview/Character).
3. Upload a legacy CSV file with score columns.
4. On the mapping screen, a **4th column** labeled "Question" (or "Trait") should appear.
5. For columns mapped as "Score Question (1-10)", a **dropdown** should show all existing questions/traits for that phase.
6. **Map to Existing:** Select an existing question from the dropdown for each score column. A banner should indicate how many existing items were found.
7. **Create New:** Leave the dropdown on "— Create New —" if no matching question exists. It will create a new question from the CSV header.
8. **Preview:** Click "Preview Import". The summary should show how many are "mapped to existing" vs "will create new".
9. **Import:** Complete the import. Go to **Settings** → **Application Questions** and verify no duplicate questions were created.

## 14. Test Results Consistency Column (Feature)
The voting results page now shows a "Consistency" percentage instead of a triangle for every candidate.

1. As an admin, go to **Results**.
2. A new **Consistency** column should appear as the last column.
3. Hover the "Consistency" header — a tooltip should explain it shows the percentage of scores within normal range.
4. Candidates with high consistency (≥80%) should show the percentage in muted text with **no warning icon**.
5. Candidates with low consistency (<80%) should show an **amber ⚠️ triangle** + amber percentage text.
6. Hover the triangle on a low-consistency row — it should show "X of Y scores flagged as outliers".
7. Click a candidate to view their detail page — the outlier count should **match** the consistency percentage on the list page.
8. **Export CSV:** Click "Export CSV". The downloaded file should include a "Consistency %" column.
