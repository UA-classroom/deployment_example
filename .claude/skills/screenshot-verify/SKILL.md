---
name: screenshot-verify
description: Visual verification using Playwright MCP screenshots. Captures screenshots of the running application, analyzes them visually, identifies mismatches against design expectations, and iterates code until the UI matches. Use when verifying visual design, layout, responsive behavior, or when you need to see what the actual rendered page looks like.
disable-model-invocation: false
user-invocable: true
argument-hint: [url-or-page-to-verify]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Screenshot-Driven Visual Verification

You are running a visual verification workflow. Your job is to capture screenshots of the running application, analyze them, identify visual issues, and fix them iteratively.

This skill requires the Playwright MCP server to be connected. If it is not available, instruct the user to run:

```
claude mcp add playwright -- npx @playwright/mcp@latest
```

## Workflow

### Step 1: Determine Target

Parse `$ARGUMENTS` to understand what to verify:

- A specific URL (e.g., `http://localhost:5173/login`)
- A page name (e.g., "login page", "dashboard", "programs list")
- A feature area (e.g., "responsive layout", "dark mode", "form validation states")

If the argument is a page name, map it to the correct URL:

| Page | URL |
|------|-----|
| Home / Landing | http://localhost:5173/ |
| Login | http://localhost:5173/login |
| About | http://localhost:5173/about |
| Contact | http://localhost:5173/contact |
| Dashboard | http://localhost:5173/dashboard |
| Programs | http://localhost:5173/dashboard/programs |
| Users | http://localhost:5173/dashboard/users |
| Settings | http://localhost:5173/dashboard/settings |

### Step 2: Ensure Servers Are Running

Check if the dev servers are running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "not running"
```

If not running, start them:
- Frontend: `cd frontend && npm run dev &`
- Backend (if needed): `cd backend && uvicorn app.main:app --reload &`

Wait for servers to be ready before proceeding.

### Step 3: Prepare Screenshot Directory

All screenshots **must** be saved to `.claude/e2e-screenshots/`. Never save screenshots to the project root or any source directory.

```bash
mkdir -p .claude/e2e-screenshots
```

Use a descriptive filename pattern:

```
.claude/e2e-screenshots/<page>-<viewport>-<status>.png
```

Examples:
- `.claude/e2e-screenshots/dashboard-desktop-baseline.png`
- `.claude/e2e-screenshots/login-mobile-FAIL.png`
- `.claude/e2e-screenshots/programs-tablet-fixed.png`

### Step 4: Capture Baseline Screenshots

Using Playwright MCP tools, capture screenshots at multiple viewport sizes:

1. **Desktop** (1920x1080): The primary view
2. **Tablet** (768x1024): Medium breakpoint
3. **Mobile** (375x667): Small breakpoint

For each viewport:
- Navigate to the target URL
- Wait for the page to fully load (network idle)
- Take a full-page screenshot

### Step 5: Analyze Screenshots

For each screenshot, evaluate:

**Layout & Structure:**
- Is the page layout correct? (sidebar visible on desktop, collapsed on mobile?)
- Are elements properly aligned?
- Is spacing consistent and generous?
- Do cards, tables, and containers have proper rounded corners and shadows?

**Color & Theme:**
- Are colors from the defined palette? (primary-600: #7C3AED, primary-50: #F5F3FF, etc.)
- Are there any stale indigo-600 or other off-palette colors?
- Is contrast sufficient for text readability?
- Do interactive elements (buttons, links) use primary-600?

**Typography:**
- Is Plus Jakarta Sans rendering correctly?
- Are heading sizes hierarchical and consistent?
- Is body text readable (not too small, proper line-height)?

**Interactive Elements:**
- Do buttons have proper hover/active states?
- Are form inputs styled with rounded-lg and primary focus rings?
- Are links distinguishable from body text?

**Responsive Behavior:**
- Does the layout adapt gracefully between breakpoints?
- Are touch targets large enough on mobile (min 44x44px)?
- Does text remain readable without horizontal scrolling?

### Step 6: Report Findings

Create a structured report:

```markdown
## Visual Verification Report: [page name]

### Desktop (1920x1080)
- [x] Layout correct
- [x] Colors on palette
- [ ] Issue: Button on line 42 of ProgramsPage.jsx uses bg-indigo-600 instead of bg-primary-600

### Tablet (768x1024)
- [x] Responsive layout working
- [ ] Issue: Sidebar overlaps content below 800px

### Mobile (375x667)
- [x] Single column layout
- [ ] Issue: Table overflows horizontally
```

### Step 7: Fix Issues (if any)

For each issue found:

1. Identify the source file and line number
2. Make the minimal fix
3. Wait for hot-reload to apply
4. Re-capture the screenshot for that viewport
5. Verify the fix resolved the issue

### Step 8: Final Verification

After all fixes:
- Capture final screenshots at all three viewports
- Confirm all issues are resolved
- Run `npm run lint` to ensure no lint regressions
- Print a summary of what was fixed

## Multi-Page Mode

If `$ARGUMENTS` is "all" or "full-site", iterate through all pages in the URL table above. For authenticated pages (dashboard/*), you will need to:

1. Navigate to /login
2. Fill credentials and submit
3. Then navigate to each dashboard page

## Notes

- Screenshots are analyzed visually by Claude -- this requires a vision-capable model
- If Playwright MCP is not available, fall back to reading component source code and analyzing Tailwind classes manually
- Always prefer fixing the root cause over adding overrides
- This skill pairs well with the `ralph-loop` skill for functional verification
