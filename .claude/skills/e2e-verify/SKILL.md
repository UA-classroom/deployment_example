---
name: e2e-verify
description: End-to-end flow verification using Playwright MCP browser automation. Simulates real user interactions -- navigating pages, filling forms, clicking buttons, and verifying outcomes. Use when testing complete user flows like login, creating a program, enrolling a student, or grading.
disable-model-invocation: false
user-invocable: true
argument-hint: [flow-name-or-description]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# E2E Flow Verification with Playwright

You are running end-to-end verification of a user flow in the YH school management system. Your job is to simulate real user interactions through the browser and verify each step produces the correct outcome.

This skill requires the Playwright MCP server to be connected. If it is not available, instruct the user to run:

```
claude mcp add playwright -- npx @playwright/mcp@latest
```

## Pre-Defined Flows

If `$ARGUMENTS` matches one of these flow names, use the corresponding test plan. Otherwise, generate a custom flow from the description.

### Flow: `login`

1. Navigate to http://localhost:5173/login
2. Verify the login form is visible (email input, password input, submit button)
3. Fill email field with test credentials
4. Fill password field
5. Click the submit button
6. Wait for redirect to /dashboard
7. Verify the dashboard page loads (sidebar visible, welcome message)
8. Take a screenshot of the logged-in dashboard

### Flow: `create-program`

Prerequisite: Must be logged in as admin.

1. Navigate to /dashboard/programs
2. Click "Skapa program" / "Create Program" button
3. Fill form fields:
   - Name: "Testprogram Webbutveckling"
   - Code: "TESTWEB26"
   - Description: "Testprogram for verifiering"
   - YH Points: 400
   - Duration: 80 weeks
4. Click submit
5. Verify redirect to program detail page
6. Verify the program name, code, and points are displayed correctly
7. Take a screenshot

### Flow: `create-course`

Prerequisite: Must be logged in as admin/staff. A program must exist.

1. Navigate to /dashboard/programs
2. Click the first program to view details
3. Click "Lagg till kurs" / "Add Course" button
4. Fill form fields:
   - Name: "Testkurs Python"
   - Code: "TESTPY01"
   - Description: "Grundlaggande Python"
   - YH Points: 30
   - Sort Order: 1
5. Click submit
6. Verify redirect back to program detail
7. Verify the course appears in the courses table
8. Take a screenshot

### Flow: `create-cohort`

Prerequisite: Must be logged in as admin. A program must exist.

1. Navigate to /dashboard/programs
2. Click the first program to view details
3. Click "Skapa kohort" / cohort creation link
4. Fill form fields:
   - Cohort Code: "TESTWEB26H"
   - Start Date: 2026-08-15
   - End Date: 2028-06-15
   - Study Pace: 100
   - Max Seats: 30
5. Click submit
6. Verify the cohort appears in the program detail
7. Take a screenshot

### Flow: `enroll-student`

Prerequisite: Must be logged in as admin/staff. A cohort must exist. A student user must exist.

1. Navigate to the cohort detail page
2. Click "Skriv in student" / enroll button
3. Select a student from the dropdown
4. Click confirm
5. Verify the student appears in the enrolled students list
6. Take a screenshot

### Flow: `grade-student`

Prerequisite: Must be logged in as staff. A cohort with enrolled students and courses must exist.

1. Navigate to the cohort grades page
2. Verify the grade grid shows students x courses
3. Click on an empty grade cell
4. Select a grade (G or VG)
5. Verify the grade is saved and displayed
6. Take a screenshot

### Flow: `full-lifecycle`

Runs all flows in sequence: login -> create-program -> create-course -> create-cohort -> enroll-student -> grade-student

## Custom Flow Generation

If `$ARGUMENTS` does not match a pre-defined flow, generate a test plan:

1. Parse the description to understand the user journey
2. Identify the pages and interactions involved
3. Map each step to a concrete browser action
4. Define expected outcomes for each step
5. Execute the flow

## Screenshot Directory

All screenshots (debug failures, verification captures, final results) **must** be saved to:

```
.claude/e2e-screenshots/
```

Before taking any screenshot, ensure the directory exists:

```bash
mkdir -p .claude/e2e-screenshots
```

Use a descriptive, timestamped filename pattern:

```
.claude/e2e-screenshots/<flow>-<step>-<status>.png
```

Examples:
- `.claude/e2e-screenshots/login-01-navigate.png`
- `.claude/e2e-screenshots/login-05-submit-FAIL.png`
- `.claude/e2e-screenshots/login-07-dashboard-PASS.png`
- `.claude/e2e-screenshots/create-program-04-form-filled.png`

Never save screenshots to the project root or any source directory.

## Execution Protocol

For each step in the flow:

### 1. Navigate

Use Playwright MCP to navigate to the target URL. Wait for the page to be fully loaded.

### 2. Interact

Use the appropriate Playwright tool:
- `browser_click(locator)` -- Click buttons, links, nav items
- `browser_fill(locator, value)` -- Fill text inputs, textareas
- `browser_select(locator, option)` -- Select dropdown values
- `browser_press_key(locator, key)` -- Press Enter, Tab, etc.

### 3. Wait

After interactions that trigger navigation or API calls, wait for:
- URL change (navigation)
- Network idle (API calls complete)
- Element visibility (new content rendered)

### 4. Verify

Check that the expected outcome occurred:
- Page URL matches expected path
- Expected elements are visible (headings, tables, badges)
- Data is displayed correctly (names, codes, numbers)
- No error messages are shown
- Console has no errors

### 5. Screenshot

Take a screenshot after each major step for the verification record.

### 6. Handle Failures

If a step fails:
- Take a screenshot of the current state
- Read the browser console for errors
- Check the network tab for failed API calls
- Investigate the relevant source code
- Attempt to fix the issue
- Retry the failed step (max 3 retries per step)

## Reporting

After the flow completes (or fails), print a summary:

```
E2E Flow: [flow-name]
Steps: [completed]/[total]
Status: PASS / FAIL

Step Results:
  1. Navigate to login     -- PASS
  2. Fill credentials      -- PASS
  3. Submit login          -- PASS
  4. Verify dashboard      -- FAIL (sidebar not visible)
     Fix: Updated Sidebar.jsx line 15
     Retry: PASS

Screenshots captured: [count]
Files modified: [list or "none"]
```

## Authentication Helper

Many flows require authentication. Before starting an authenticated flow:

1. Navigate to http://localhost:5173/login
2. Fill email with the appropriate test user credentials
3. Fill password
4. Submit the form
5. Wait for redirect to /dashboard
6. Verify the token is stored (check localStorage via JS execution)

If login fails, check:
- Is the backend running?
- Does the test user exist in the database?
- Are the credentials correct?

Suggest running the seed script if no users exist:
```bash
cd backend && python -m scripts.seed_db
```

## Notes

- All flows assume the dev servers are running (frontend on 5173, backend on 8000)
- If servers are not running, start them before proceeding
- Test data created during verification may persist in the database
- This skill pairs well with `screenshot-verify` for visual checks and `ralph-loop` for iterative fixing
- Always run linters after any code changes
