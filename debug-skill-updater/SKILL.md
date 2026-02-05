---
name: debug-skill-updater
description: Extract the root cause and fix from a recent game-debugging chat, then propose targeted updates to the skills used to build the game (SKILL.md, references, scripts) so the fix becomes reusable guidance. Use after debugging Phaser, Playwright, canvas/WebGL, or similar skill-built games when the user asks to "teach", "update", or "retrofit" skills with the fix.
---

# Debug Skill Updater

## Overview

Convert a completed debugging conversation into minimal, high-leverage skill updates. Identify the skills that produced the game, distill the failure and fix into reusable guidance, and propose patches for approval.

## Workflow

1. Extract the fix from the chat.
Summarize the failure in a compact, reusable form using the fields below. If any field is unclear, ask a single clarifying question before drafting changes.

2. Identify the target skills to update.
Look for explicit skill mentions, open tabs, directories, or files touched in the session. Prefer the minimal set of skills that directly caused or could prevent the bug. If multiple skills overlap, split updates by responsibility rather than duplicating guidance.

3. Translate the fix into reusable skill guidance.
Add the smallest change that would have prevented or quickly resolved the issue, but phrase it as a general rule that applies across game types, engines, and frameworks. Use SKILL.md for concise workflow guidance, add a references file if the guidance is long or variant-specific, and add a script only when deterministic automation is needed. Update the target skill's frontmatter description if new trigger conditions are introduced.

4. Draft a proposal without applying edits.
Provide a short summary and a patch-style proposal for each file. Ask for explicit approval before modifying any skill files.

5. After approval, apply and validate.
Apply the edits, run the skill validator for each updated skill, and report results. If a script is added, run it once with a safe, representative input if feasible.

## Debug Capture (Required Fields)

Capture the failure and fix in this structure before proposing updates.

- Symptom: Observable incorrect behavior.
- Trigger: Exact user action or state that causes the issue.
- Root cause: Precise technical explanation.
- Fix: Change that resolves the issue.
- Verification: How the fix was confirmed.
- Preventive rule: Short rule or checklist item that would have prevented the bug.

If any field cannot be inferred from the chat, ask one clarifying question and pause.

## Update Strategy

- Prefer adding a single new section such as "Troubleshooting" or "Common Failures" to the target skill instead of broad rewrites.
- Keep changes minimal and scoped to the root cause.
- Avoid duplicating guidance across skills; split by responsibility.
- Do not invent fixes that are not supported by the chat evidence.
- Avoid overfitting to a single game or framework. Express updates as general principles, heuristics, or diagnostic steps that apply to any game (2D/3D, canvas/WebGL, engine-agnostic).
- If a fix is engine-specific, wrap it in a broader, engine-agnostic rule and then add the specific example as a short "Example" note.
- Reject updates that would hard-code exact values, asset names, or project-specific settings unless they are required for correctness across multiple games.

## Proposal Output

Return the proposal in this order.

- Summary: 1-3 sentences describing the bug and the intended skill updates.
- Proposed updates: One block per file with a patch-style snippet and the exact file path.
- Questions: Only if approval or missing information is required.
