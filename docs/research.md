# What the Experts Say About Writing a Good CLAUDE.md

## Andrej Karpathy — "Mistakes Become Rules"

Karpathy, who went from 80% manual coding to 80% agent coding in weeks, identified **three core failure modes** of AI agents that CLAUDE.md should address:

1. **Wrong assumptions** — agents don't seek clarification, don't surface tradeoffs
2. **Overcomplicated code** — bloated abstractions, 1000 lines when 100 would do
3. **Unintended side effects** — changing comments/code they don't understand

His community-codified **four principles**:

- **Think before coding** — state assumptions explicitly, ask if uncertain
- **Simplicity first** — no features beyond what was requested, no speculative abstractions
- **Surgical changes** — touch only what you must, match existing style
- **Goal-driven execution** — define success criteria, loop until verified

Key insight: **Use declarative success criteria, not imperative instructions.** Instead of "write a function that does X", say "I want users to be able to sign in with Google" and let the agent plan, code, test, fix, and retest autonomously.

He also coined **"context engineering"** as the successor to "prompt engineering" — CLAUDE.md is a key piece, but too much or too irrelevant context *degrades* performance.

**Sources:**
- [Karpathy's X post on Claude coding](https://x.com/karpathy/status/2015883857489522876)
- [GitHub: andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md)
- [Karpathy's X post on context engineering](https://x.com/karpathy/status/1937902205765607626)
- [Karpathy's 2025 Year in Review](https://karpathy.bearblog.dev/year-in-review-2025/)

---

## Boris Cherny (Creator of Claude Code) — "The Living Team Document"

Boris's team CLAUDE.md is ~**100 lines / 2,500 tokens**. His core philosophy:

> "Anytime we see Claude do something incorrectly, we add it to the CLAUDE.md, so Claude knows not to do it next time."

**What to include:**

- Build/run/test commands (`bun run typecheck`, `bun run test`, `bun run lint`)
- Style conventions ("Prefer `type` over `interface`; never use `enum`")
- Architectural decisions and design guidelines
- Common failure modes specific to your codebase
- PR templates and workflow steps

**Key practices:**

- CLAUDE.md is a **shared team artifact**, not a personal file — the whole team maintains it
- **Let Claude write its own rules** — after correcting it, say "update your CLAUDE.md so you don't make that mistake again"
- **Ruthlessly edit** — remove outdated rules, consolidate duplicates, sharpen language
- Use **progressive disclosure** — slash commands in `.claude/commands/`, custom agents in `.claude/agents/`, separate docs files
- Start most sessions in **Plan Mode** (Shift+Tab), iterate on the plan, then switch to execution
- **Verification loops** are "probably the most important thing" — giving Claude a way to verify its own work improves quality by 2-3x
- Run **parallel sessions** using git worktrees for the single biggest productivity unlock

**Sources:**
- [Boris Cherny's X thread (Jan 3, 2026) — "How I use Claude Code"](https://x.com/bcherny/status/2007179832300581177)
- [Boris Cherny's X thread (Feb 11, 2026) — Team tips](https://x.com/bcherny/status/2017742741636321619)
- [How Boris Uses Claude Code (dedicated site)](https://howborisusesclaudecode.com/)
- [Head of Claude Code: What happens after coding is solved — Lenny's Newsletter](https://www.lennysnewsletter.com/p/head-of-claude-code-what-happens)
- [Inside the Development Workflow of Claude Code's Creator — InfoQ](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/)

---

## Simon Willison — "Good Engineering Fundamentals Over Instructions"

Willison doesn't prescribe a specific template but advocates for:

- **Progressive disclosure over monolithic files** — his Claude Skills work shows only YAML frontmatter is scanned at startup, full details loaded on demand
- **Test-driven development with agents** — "Use red/green TDD" is one of the most powerful single instructions you can give
- **Good tooling matters more than elaborate instructions** — write scripts/Makefile commands, consolidate logs, design tools with clear error messages
- **Security awareness** — be careful about what permissions and capabilities you describe (the "lethal trifecta": private data + untrusted content + external actions)

**Sources:**
- [Claude Skills are awesome, maybe a bigger deal than MCP](https://simonwillison.net/2025/Oct/16/claude-skills/)
- [Writing about Agentic Engineering Patterns](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)
- [Designing agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)
- [Claude Code: Best practices for agentic coding](https://simonwillison.net/2025/Apr/19/claude-code-best-practices/)
- [The lethal trifecta for AI agents](https://simonw.substack.com/p/the-lethal-trifecta-for-ai-agents)

---

## Anthropic (Official) — "The Curse of Instructions"

- Frontier LLMs can follow ~**150-200 instructions** with reasonable consistency
- Claude Code's system prompt already contains ~50, leaving limited capacity for yours
- As instruction count rises, **instruction-following quality decreases uniformly**

**Source:** [Anthropic — Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## Addy Osmani (Google) — "Three-Tier Boundaries"

- **"Always do"** — no approval needed (run tests, lint)
- **"Ask first"** — high-impact decisions needing human review
- **"Never do"** — hard stops ("never commit secrets")
- Start with **high-level vision first** (what and why), not the nitty-gritty how
- **Modularity over monolithic prompts** — divide specs into focused sections
- Treat specs as **living, version-controlled documents**

**Sources:**
- [How to write a good spec for AI agents — AddyOsmani.com](https://addyosmani.com/blog/good-spec/)
- [How to write a good spec for AI agents — O'Reilly](https://www.oreilly.com/radar/how-to-write-a-good-spec-for-ai-agents/)

---

## HumanLayer Blog — Practical Structure

- Keep under **300 lines** (their root file is under 60)
- Structure: **WHAT** (map your codebase), **WHY** (explain purpose), **HOW** (how Claude should work)
- **Use imperative language**: "Use functional components" not "The project uses functional components"
- **Provide alternatives, not just prohibitions**: "Don't do X" is less useful than "Do Y instead of X"
- **Use pointers, not copies**: reference `file:line` instead of embedding code snippets that go stale
- **Never use Claude as a linter** — set up proper tooling instead
- **Avoid the `/init` auto-generation command** — manually craft CLAUDE.md with care

**Source:** [HumanLayer — Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## Academic Research (328 CLAUDE.md files analyzed)

- **72.6%** contained architecture specifications
- Most common sections: Development Guidelines, Project Overview, Testing Guidelines, Code Style

**Sources:**
- [Decoding the Configuration of AI Coding Agents (arxiv)](https://arxiv.org/abs/2511.09268)
- [On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents (arxiv)](https://arxiv.org/html/2601.20404v1)

---

## Other Notable Voices

- **Steve Sewell (Builder.io)** — Create dos/don'ts sections, specify file-scoped commands for faster feedback, provide concrete code examples, use hierarchical AGENTS.md in subdirectories. ([Source](https://www.builder.io/blog/agents-md))
- **Harper Reed** — Uses a reasoning model to generate specs first (`spec.md`, `prompt_plan.md`), then feeds them to Claude Code. ([Source](https://harper.blog/2025/05/08/basic-claude-code/))
- **Peter Steinberger** — Created the [agent-rules](https://github.com/steipete/agent-rules) repo, organizing rules into global rules, project rules, and topic-specific documentation.
- **Trail of Bits** — Published security-focused [claude-code-config](https://github.com/trailofbits/claude-code-config) with opinionated safe defaults.

---

## Consensus Best Practices

| Practice | Why |
|---|---|
| **Keep it short** (~100 lines, max 300) | "Curse of instructions" — more rules = worse compliance |
| **Iterate from real mistakes** | Every correction becomes a permanent rule |
| **Be imperative and actionable** | Direct commands, not descriptions |
| **Include build/test/lint commands** | Most universally useful content |
| **Use progressive disclosure** | Reference separate files for detail, keep root lean |
| **Provide alternatives, not just prohibitions** | "Do Y" beats "Don't do X" |
| **Declare success criteria, not steps** | Let agents loop autonomously |
| **Treat it as a living document** | Review, prune, sharpen regularly |
| **Let Claude write its own rules** | It's "eerily good" at self-correction |
| **Don't use LLMs as linters** | Set up proper tooling instead |
| **Include architecture and project structure** | Found in 72.6% of real-world CLAUDE.md files |
| **Mind security implications** | Be cautious about permissions and exposed information |