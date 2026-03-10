---
name: ralph-loop
description: Autonomous verification loop that tests frontend features, tracks pass/fail state, and self-corrects until all test cases pass. Use when you need to verify that a feature works end-to-end, fix broken UI flows, or validate a set of acceptance criteria against the running application.
disable-model-invocation: true
user-invocable: true
argument-hint: [feature-or-flow-to-verify]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebFetch
---

# Ralph Loop -- Autonomous Verification & Self-Correction

You are running an autonomous verification loop. Your job is to test the running application against defined acceptance criteria, and if something fails, fix the code and retest until everything passes.

## How It Works

You maintain three state files in `.claude/ralph-loop/`:

- **status.json** -- Machine-readable pass/fail tracking per test case
- **results.md** -- Human-readable log of every iteration (what you tried, what happened, what you fixed)
- **test-cases.md** -- The acceptance criteria you are testing against

## Initialization

If `.claude/ralph-loop/` does not exist or `status.json` is missing, initialize:

1. Create the directory: `.claude/ralph-loop/`
2. Analyze `$ARGUMENTS` to understand what feature or flow to verify
3. Generate `test-cases.md` with 3-8 concrete, testable acceptance criteria based on the feature. Each test case has:
   - **ID**: `TC-01`, `TC-02`, etc.
   - **Description**: What to test in plain language
   - **Steps**: Exact actions to perform
   - **Expected result**: What success looks like
4. Generate `status.json` with all test cases set to `"pending"`
5. Create an empty `results.md` with a header

### status.json format

```json
{
  "feature": "login-flow",
  "started_at": "2026-03-03T12:00:00",
  "iteration": 0,
  "cases": {
    "TC-01": { "status": "pending", "last_error": null },
    "TC-02": { "status": "pending", "last_error": null }
  }
}
```

## The Loop

Repeat this cycle until all test cases pass or you reach 10 iterations:

### Step 1: Read State

Read `status.json` and `test-cases.md`. Identify the first test case that is `"pending"` or `"failed"`.

### Step 2: Execute Test

Run the test case against the live application:

- If the app needs to be running, start it (check if ports 5173/8000 are already in use first)
- Use `curl`, `fetch`, or browser-based verification as appropriate
- For visual checks, describe what you expect to see and verify by reading the component source code
- For API checks, use curl against the backend endpoints
- For form interactions, trace the code path: component -> fetch call -> API endpoint -> service -> database

### Step 3: Evaluate Result

Compare actual behavior against the expected result from `test-cases.md`:

- **Pass**: Mark as `"passed"` in `status.json`
- **Fail**: Mark as `"failed"` with `"last_error"` describing what went wrong

### Step 4: Log Iteration

Append to `results.md`:

```markdown
## Iteration N -- TC-XX: [description]

**Status**: PASS / FAIL
**What happened**: [actual behavior observed]
**Expected**: [from test case]
**Action taken**: [if fail: what code was changed and why]
**Files modified**: [list of files touched]
```

### Step 5: Fix (if failed)

If the test failed:

1. Investigate the root cause by reading relevant source files
2. Make the minimum code change to fix the issue
3. Do NOT fix unrelated issues -- stay focused on this test case
4. After fixing, re-run the same test case (do not advance to the next one)

### Step 6: Update State

Increment `"iteration"` in `status.json`. If all cases are `"passed"`, stop the loop.

## Completion

When all test cases pass (or max iterations reached):

1. Read `status.json` and `results.md`
2. Print a summary table:

```
Feature: [name]
Iterations: [count]
Results:
  TC-01: PASS -- [description]
  TC-02: PASS -- [description]
  TC-03: FAIL -- [description] (gave up after 3 attempts)
```

3. If any tests still fail, explain what is blocking them and suggest manual steps

## Rules

- Never skip a failed test -- fix it before moving on
- Never mark a test as passed unless you have verified it
- Keep fixes surgical -- do not refactor or improve unrelated code
- Log every iteration, even if nothing changed
- If you are stuck on the same test for 3 iterations, mark it as `"blocked"` and move on
- Always run the project linter after code changes (`npm run lint` for frontend, `ruff check .` for backend)
- Respect the project rules in CLAUDE.md and .claude/rules/
