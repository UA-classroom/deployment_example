# Claude Code Hooks -- Suggestions for This Project

Hooks are shell commands that run automatically at specific points in Claude Code's lifecycle. Unlike rules (best-effort) or skills (manually triggered), hooks are **deterministic** -- exit code 2 means the action is blocked, no exceptions.

**Config location:** `.claude/settings.local.json` (gitignored, personal) or `.claude/settings.json` (shared, committable).

**Key events used below:**

| Event | When it fires | Can block? |
|-------|--------------|------------|
| `PreToolUse` | Before a tool call executes | Yes (exit 2) |
| `PostToolUse` | After a tool call succeeds | No (side effects only) |
| `SessionStart` | When a session begins or resumes | Yes |
| `PreCompact` | Before context compaction | No |

---

## 1. Auto-Format After Edits (IMPLEMENTED)

**Event:** `PostToolUse` with matcher `Edit|Write`
**Problem:** CLAUDE.md says "run lint after changes" but that is a rule Claude can forget.
**Solution:** Automatically run Prettier (frontend) and Ruff (backend) after every file edit.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=\"$(jq -r '.tool_input.file_path' <<< \"$(cat)\")\"\nif [[ \"$FILE\" =~ \\.(js|jsx|ts|tsx|json|css)$ ]]; then\n  npx prettier --write \"$FILE\" 2>/dev/null\nelif [[ \"$FILE\" =~ \\.py$ ]]; then\n  python -m ruff format \"$FILE\" 2>/dev/null\n  python -m ruff check --fix \"$FILE\" 2>/dev/null\nfi\nexit 0"
          }
        ]
      }
    ]
  }
}
```

**Prerequisites:** `pip install ruff` and `cd frontend && npm install --save-dev prettier`.

---

## 2. Progress File After Compaction (IMPLEMENTED)

**Event:** `SessionStart` with matcher `compact`
**Problem:** After context compaction, Claude loses track of what was discussed and what progress was made.
**Solution:** A SessionStart hook that reads a conversation-specific progress file after compaction. Anything written to stdout by a SessionStart hook gets injected as context.

Pair this with a `PreCompact` hook that reminds Claude to save progress before compaction occurs.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'IMPORTANT: Context is about to be compacted. Save your current progress to .claude/progress.md before continuing.'"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "SESSION_ID=$(jq -r '.session_id' <<< \"$(cat)\")\nif [ -f \".claude/progress-${SESSION_ID}.md\" ]; then\n  cat \".claude/progress-${SESSION_ID}.md\"\nelif [ -f .claude/progress.md ]; then\n  cat .claude/progress.md\nelse\n  echo 'No progress file found. Ask the user for context.'\nfi"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Protect .env and Secrets (NOT YET IMPLEMENTED)

**Event:** `PreToolUse` with matcher `Edit|Write|Read|Bash`
**Problem:** CLAUDE.md says never output, share, or commit .env files. A rule can be forgotten.
**Solution:** Block any attempt to read, edit, or write files matching `.env`, `secrets`, or `credentials`.

**Hook script** (`.claude/hooks/protect-secrets.sh`):

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

for pattern in ".env" "secrets" "credentials"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: cannot edit files matching '$pattern'" >&2
    exit 2
  fi
done

if echo "$COMMAND" | grep -qE "(cat|echo|type|head|tail).*\.env"; then
  echo "Blocked: cannot read .env files" >&2
  exit 2
fi

exit 0
```

**Config:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Read|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-secrets.sh\""
          }
        ]
      }
    ]
  }
}
```

---

## 4. Guard Database Migrations (NOT YET IMPLEMENTED)

**Event:** `PreToolUse` with matcher `Bash`
**Problem:** CLAUDE.md says "ask first" before database model changes that require migrations. Running `alembic upgrade head` or generating migrations without approval can break the database.
**Solution:** Block alembic commands and force Claude to ask the user first.

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE "alembic (revision|upgrade|downgrade)"; then
  echo "Blocked: migration commands require explicit user approval." >&2
  exit 2
fi

exit 0
```

---

## 5. Block Dangerous DB Operations (NOT YET IMPLEMENTED)

**Event:** `PreToolUse` with matcher `Bash`
**Problem:** This app manages student records, grades, and compliance data. Accidental DROP TABLE or TRUNCATE would be catastrophic.
**Solution:** Block known destructive SQL/git patterns.

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=("DROP TABLE" "DROP DATABASE" "TRUNCATE" "DELETE FROM" "--force" "reset --hard")

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiE "$pattern"; then
    echo "Blocked: dangerous operation detected ('$pattern')." >&2
    exit 2
  fi
done

exit 0
```

---

## 6. Protect Security-Critical Files (NOT YET IMPLEMENTED)

**Event:** `PreToolUse` with matcher `Edit|Write`
**Problem:** CLAUDE.md says "ask first" before changes to auth flow or security.py. Accidental changes could weaken authentication or lock users out.
**Solution:** Block edits to security.py, alembic.ini, and alembic/env.py.

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED_FILES=("security.py" "alembic.ini" "alembic/env.py")

for protected in "${PROTECTED_FILES[@]}"; do
  if [[ "$FILE_PATH" == *"$protected"* ]]; then
    echo "Blocked: '$protected' is a protected file. Ask the user first." >&2
    exit 2
  fi
done

exit 0
```

---

## Hook Cheat Sheet

| Exit code | Effect |
|-----------|--------|
| `0` | Action proceeds. Stdout is injected as context (for SessionStart/UserPromptSubmit). |
| `2` | Action is **blocked**. Stderr becomes feedback to Claude. |
| Other | Action proceeds. Stderr is logged but not shown to Claude. |

**Testing a hook manually:**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | bash .claude/hooks/my-hook.sh
echo $?  # Check exit code
```

**Debugging:** Toggle verbose mode with `Ctrl+O` in Claude Code, or run `claude --debug`.

---

## References

- [Official Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Official Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Community hooks collection](https://github.com/karanb192/claude-code-hooks)
