AI GAME STUDIO MVP - SUPER DETAILED REPOSITORY BUILD DOCUMENT
=============================================================

Document type: repository implementation and artifact inventory
Snapshot generated (UTC): 2026-02-05 23:16:34 UTC
Snapshot generated (local): 2026-02-05 15:16:34 PST
Git branch: main
Git commit: 5f85a73

1) EXECUTIVE SUMMARY
--------------------
This repository is an AI-driven browser game studio MVP with:
- A FastAPI backend that creates game workspaces, queues Codex runs, streams run events, and stores metadata.
- A React + TypeScript frontend for game discovery, AI prompting, live generation streaming, and playtesting.
- A games corpus with both legacy single-file HTML games and folderized generated games (index.html + game.json + optional card image).
- Multiple reusable Codex skills (orchestrator, canvas/webgl game builders, AI opponent builder, Phaser guidance, Playwright testing).
- A vendored root Python virtual environment tracked in git (.venv), which dominates file count.

Tracked file totals at snapshot:
- Total tracked files: 1865
- Tracked files excluding .venv/: 117
- Tracked files under .venv/: 1748
- Approx bytes excluding .venv/: 959626
- Approx bytes under .venv/: 31189094

2) TOP-LEVEL REPOSITORY BREAKDOWN
----------------------------------
Tracked files by top-level path:
- .DS_Store: 1
- .agents: 10
- .gitignore: 1
- .system: 18
- .venv: 1748
- README.md: 1
- ai.js: 1
- backend: 9
- frontend: 19
- game-build-orchestrator: 6
- games: 26
- phaser-gamedev: 6
- playwright-testing: 6
- vibecode-canvas-arcade: 3
- vibecode-opponent-ai: 4
- vibecode-webgl-arcade: 6

Tracked files by extension (basename-derived):
- (noext): 164
- 9: 2
- APACHE: 1
- BSD: 1
- DS_Store: 2
- c: 1
- cfg: 2
- csh: 1
- css: 1
- exe: 10
- fish: 1
- gitignore: 1
- html: 20
- js: 1
- json: 10
- local-backup-20260205-123823: 1
- marker: 1
- md: 40
- pem: 2
- png: 3
- ps1: 1
- pth: 1
- pxd: 27
- pxi: 2
- py: 1446
- pyi: 7
- pyx: 25
- so: 7
- svg: 2
- test: 1
- tmpl: 2
- ts: 4
- tsx: 9
- txt: 30
- typed: 27
- xml: 1
- yaml: 8

3) CORE APPLICATION ARCHITECTURE
--------------------------------
3.1 Backend (FastAPI, /backend)
- Runtime stack: fastapi==0.115.6, uvicorn[standard]==0.32.1, openai>=1.60.0, pytest==8.3.4, httpx==0.28.1
- App factory: backend/app/main.py:create_app
- CORS origins: http://localhost:5173 and http://127.0.0.1:5173
- Static mount: /games -> filesystem games directory
- Settings source: backend/app/settings.py
  - GAMES_DIR (default <repo>/games)
  - CODEX_BIN (default codex)
  - CODEX_MODEL (optional)
  - TITLE_MODEL (default gpt-4o-mini)
  - IMAGE_MODEL (default gpt-image-1)

Backend API routes implemented in backend/app/main.py:
- GET /api/health
- GET /api/games
- POST /api/games
- GET /api/games/{slug}
- POST /api/games/{slug}/generate
- GET /api/runs/{run_id}/events (SSE stream)
- POST /api/runs/{run_id}/cancel

Backend internal modules:
- backend/app/models.py
  - Pydantic contracts: ChatMessage, CreateGameRequest, GenerateGameRequest, GameRecord, GenerateGameResponse, CancelRunResponse, RunEvent
  - RunStatus enum: queued, running, completed, failed, cancelled
- backend/app/storage.py
  - Creates game folders and placeholder index.html
  - Reads/writes game.json metadata
  - Supports legacy flat HTML games in /games root
  - Materializes legacy HTML into folder format when needed
  - Resolves previewUrl and imageUrl candidates
- backend/app/prompting.py
  - Builds Codex game prompt with recent chat context
  - Generates title via OpenAI Chat Completions
  - Generates card image via OpenAI Images API
- backend/app/run_manager.py
  - Queues game generation runs
  - Spawns codex exec subprocess with --json streaming
  - Writes run logs to games/<slug>/.runs/<runId>.jsonl
  - Writes final assistant message to .last.txt
  - Emits SSE events: status, queue_position, assistant_response, metadata_updated, run_finished
  - Supports cancellation for queued and running jobs

Codex command shape used by RunManager:
- codex exec --dangerously-bypass-approvals-and-sandbox --json --cd <gameDir> [--output-last-message <path>] -

3.2 Frontend (React + TS + Vite, /frontend)
- Build toolchain: Vite 5 + TypeScript + React 18 + React Router 6
- Test stack: Vitest + Testing Library + jsdom
- Vite proxy config:
  - /api -> http://localhost:8000
  - /games -> http://localhost:8000
- Route map (frontend/src/App.tsx):
  - / -> HomePage
  - /create -> CreatePage
  - /play/:slug -> PlayPage
  - * -> redirect /

Frontend functional behavior by page:
- HomePage
  - Loads game list from GET /api/games
  - Search filter on title
  - Grid cards route to /play/<slug>
- CreatePage
  - Optional existing game context via query param slug
  - Creates untitled game on first prompt if needed (POST /api/games)
  - Starts generation run (POST /api/games/{slug}/generate)
  - Subscribes to SSE stream /api/runs/{runId}/events
  - Appends assistant deltas into chat log
  - Supports run cancel (POST /api/runs/{runId}/cancel)
  - Live iframe preview with cache-busting timestamp
- PlayPage
  - Fetches game metadata by slug
  - Embeds playable iframe from previewUrl

Frontend visual system summary (frontend/src/styles.css):
- Tokenized CSS variables for panel/ink/line/brand colors
- Home grid card layout + sticky top bar
- Split-pane create layout (chat + live preview)
- Typing indicator animation
- Responsive behavior below 900px (stacked layout)

3.3 Game Output Model (/games)
- Legacy mode: single-file game HTML at games/<slug>.html
- Folder mode: games/<slug>/index.html + game.json + optional card image
- Metadata fields in game.json: slug, title, createdAt, updatedAt
- Card image discovery candidates include card.*, cover.*, thumbnail.*

4) IMPLEMENTED GAME CATALOG (PLAYABLE ARTIFACTS)
-------------------------------------------------
Format: path | title | engine classification | lines | bytes | classes | functions | requestAnimationFrame refs | high-level gameplay note
- games/asteroid-shepherd.html | Asteroid Shepherd | Canvas 2D | 1208 | 33429 | 8 | 0 | 2 | Bump drifting asteroids away from fragile edge stations. No weapons, only momentum.
- games/brickfall-arena.html | Brickfall Arena | Canvas 2D | 940 | 29745 | 5 | 1 | 2 | Real-time falling blocks. Stay alive as the pace spikes.
- games/flappybird.html | Flappy Bird Clone | Canvas 2D | 684 | 19875 | 7 | 0 | 2 | (No extracted descriptive paragraph)
- games/game-20260205211554/index.html | Neon Rail Rush | Canvas 2D | 844 | 24825 | 9 | 0 | 2 | Surf the neon rails and dodge the city hazards.
- games/game-20260205214346/index.html | Neon Nibble Snake | Canvas 2D | 675 | 19144 | 6 | 0 | 2 | Munch the candy fruit. Avoid walls and your own tail!
- games/game-20260205222112/index.html | Untitled Game | Canvas 2D | 781 | 23883 | 6 | 0 | 2 | Use arrow keys or WASD to guide your chomper through the maze. Eat all pellets, snag the power orbs, and dodge the ghosts.
- games/game-20260205222514/index.html | Untitled Game | Unknown/Placeholder | 14 | 438 | 0 | 0 | 0 | Game files will appear here after the first AI generation.
- games/game-20260205223020/index.html | Pac Maze Dash | Canvas 2D | 797 | 24125 | 6 | 0 | 2 | Eat every pellet, dodge the ghosts, and grab power pellets to turn the tables.
- games/grid-chase.html | Operation Gridline | Canvas 2D | 1645 | 47460 | 11 | 5 | 2 | COD-inspired tactical survival. Clear six hostile waves and hold your ground.
- games/minecraft-clone.html | Block Realm Survival | WebGL/Three.js | 2093 | 66374 | 9 | 4 | 2 | Click resume to continue and recapture mouse look.
- games/neon-drift.html | Neon Drift | Canvas 2D | 840 | 25171 | 8 | 0 | 2 | Hold the lane. Smash meteors while dashing.
- games/neon-godge/index.html | Neon godge | Canvas 2D | 586 | 16711 | 6 | 0 | 2 | Eat the neon orbs, grow longer, and dodge the walls or your own tail.
- games/skyline-surge-3d.html | Skyline Surge 3D | WebGL/Three.js | 1325 | 43540 | 9 | 2 | 2 | (No extracted descriptive paragraph)
- games/skyline-surge-3d/index.html | Skyline Surge 3D | WebGL/Three.js | 1325 | 43540 | 9 | 2 | 2 | (No extracted descriptive paragraph)
- games/subwaysurfer.html | Subway Runner 3D | Canvas 2D | 755 | 22942 | 8 | 0 | 2 | Use ARROW KEYS or WASD to Move
- games/webgl-lane-dodger.html | Neon Lane Dodger | WebGL/Three.js | 649 | 19121 | 6 | 1 | 2 | Dodge incoming blocks as speed ramps up. Survive as long as possible.
- games/zombieshooter.html | Zombie Survival Shooter | Canvas 2D | 655 | 19499 | 8 | 0 | 2 | Survive as long as you can.

Per-folder generated game metadata (game.json):
- games/game-20260205211554/game.json -> slug=game-20260205211554 | title=Neon Rail Rush | createdAt=2026-02-05T21:15:54.336229+00:00 | updatedAt=2026-02-05T21:21:07.878952+00:00
- games/game-20260205214346/game.json -> slug=game-20260205214346 | title=Cartoon Chomp Snake | createdAt=2026-02-05T21:43:46.111019+00:00 | updatedAt=2026-02-05T21:49:27.469080+00:00
- games/game-20260205222112/game.json -> slug=game-20260205222112 | title=Untitled Game | createdAt=2026-02-05T22:21:12.472736+00:00 | updatedAt=2026-02-05T22:24:42.001269+00:00
- games/game-20260205222514/game.json -> slug=game-20260205222514 | title=Untitled Game | createdAt=2026-02-05T22:25:14.874161+00:00 | updatedAt=2026-02-05T22:25:14.874161+00:00
- games/game-20260205223020/game.json -> slug=game-20260205223020 | title=Untitled Game | createdAt=2026-02-05T22:30:20.280288+00:00 | updatedAt=2026-02-05T22:35:25.468199+00:00
- games/neon-godge/game.json -> slug=neon-godge | title=Neon godge | createdAt=2026-02-05T20:52:02.349320+00:00 | updatedAt=2026-02-05T20:59:02.308907+00:00
- games/skyline-surge-3d/game.json -> slug=skyline-surge-3d | title=Skyline Surge 3d | createdAt=2026-02-05T22:37:59.261692+00:00 | updatedAt=2026-02-05T22:35:56.009601+00:00

5) AI OPPONENT MODULE
----------------------
File: ai.js
- Exposes global/module API: GridChaseAI.decideAction(state)
- Core behavior: deterministic, legal-action-constrained pathing
- Strategy stack:
  - Normalizes input state (grid, blocked cells, legal actions, me/target)
  - Attempts A* first-direction search within time budget
  - Falls back to greedy Manhattan-distance move
  - Final fallback to legal WAIT/move action
- Determinism support: rngSeed directional ranking
- Safety: validates legality before returning any action

6) SKILLS AND ORCHESTRATION ASSETS
----------------------------------
Repo-local skill packs and guidance included:
- ./.agents/skills/vibecode-canvas-arcade/SKILL.md
  - frontmatter name: vibecode-canvas-arcade
  - heading: Vibecode Canvas Arcade
  - description: Build complete single-file HTML5 Canvas arcade games in the same house framework used by flappybird.html, zombieshooter.html, and subwaysurfer.html (canvas + DOM overlays, class-based entities, Game manager, requestAnimationFrame loop). Use when the user asks to vibecode a playable browser game in one shot for a Roblox-style game platform, create arcade game variants, or keep new games stylistically consistent with those reference files.
- ./.agents/skills/vibecode-game-card-image/SKILL.md
  - frontmatter name: vibecode-game-card-image
  - heading: Vibecode Game Card Image
  - description: Generate a polished game card image for each game folder using the OpenAI Image API. Use when creating or iterating a game so home-screen cards can show a representative visual. Produce `card.png` in the current game folder.
- ./.system/skill-creator/SKILL.md
  - frontmatter name: skill-creator
  - heading: Skill Creator
  - description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations.
- ./.system/skill-installer/SKILL.md
  - frontmatter name: skill-installer
  - heading: Skill Installer
  - description: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos).
- ./game-build-orchestrator/SKILL.md
  - frontmatter name: game-build-orchestrator
  - heading: Game Build Orchestrator
  - description: Orchestrate game delivery from an initial game idea through confirmation, mode routing, feasibility gating, and build routing. Use when Codex must (1) restate and validate understanding with the user in a loop, (2) choose 2D or 3D build path by routing between $vibecode-canvas-arcade and $vibecode-webgl-arcade, and (3) decide whether to invoke $vibecode-opponent-ai for a deterministic opponent.
- ./phaser-gamedev/SKILL.md
  - frontmatter name: phaser-gamedev
  - heading: Phaser Game Development
  - description: Build 2D browser games with Phaser 3 (JS/TS): scenes, sprites, physics (Arcade/Matter), tilemaps (Tiled), animations, input. Trigger: 'Phaser scene', 'Arcade physics', 'tilemap', 'Phaser 3 game'.
- ./playwright-testing/SKILL.md
  - frontmatter name: playwright-testing
  - heading: Frontend Testing
  - description: Plan, implement, and debug frontend tests: unit/integration/E2E/visual/a11y. Use for Playwright/Cypress/Vitest/Jest/RTL, flaky test triage, CI stabilization, and canvas/WebGL games (Phaser) needing deterministic input + screenshot/state assertions.
- ./vibecode-canvas-arcade/SKILL.md
  - frontmatter name: vibecode-canvas-arcade
  - heading: Vibecode Canvas Arcade
  - description: Build complete single-file HTML5 Canvas arcade games in the same house framework used by flappybird.html, zombieshooter.html, and subwaysurfer.html (canvas + DOM overlays, class-based entities, Game manager, requestAnimationFrame loop). Use when the user asks to vibecode a playable browser game in one shot for a Roblox-style game platform, create arcade game variants, or keep new games stylistically consistent with those reference files.
- ./vibecode-opponent-ai/SKILL.md
  - frontmatter name: vibecode-opponent-ai
  - heading: Vibecode Opponent AI
  - description: Generate drop-in JavaScript opponent AI modules (`ai.js`) for HTML games with a `decideAction(state)` action selector. Use when Codex needs FSM, Utility AI, Minimax, or A* behavior with strict legal-action enforcement, deterministic decisions, browser time budgets, and fixed deliverables (technique summary, full code, and tests), especially in vibecode-canvas-arcade projects.
- ./vibecode-webgl-arcade/SKILL.md
  - frontmatter name: vibecode-webgl-arcade
  - heading: Vibecode WebGL Arcade
  - description: Build complete browser-playable 3D arcade games using WebGL (default Three.js) with a consistent house framework (renderer + scene + camera + lights + entities + DOM HUD overlays). Use when the user asks for a fast 3D game prototype/MVP in the browser with start/play/game-over/restart flow, or asks for a close clone/remake in HTML + Three.js (for example: "Make a XXXGAME clone in HTML using Three JS, be as detailed as possible, it should be the closest clone you can make").

7) TOOLING + ENVIRONMENT ARTIFACTS
----------------------------------
- Root .venv is committed and currently contains 1748 tracked files.
- Detected Python distribution metadata directories in .venv/site-packages:
- annotated_types-0.7.0.dist-info
- anyio-4.12.1.dist-info
- certifi-2026.1.4.dist-info
- click-8.1.8.dist-info
- exceptiongroup-1.3.1.dist-info
- fastapi-0.115.6.dist-info
- h11-0.16.0.dist-info
- httpcore-1.0.9.dist-info
- httptools-0.7.1.dist-info
- httpx-0.28.1.dist-info
- idna-3.11.dist-info
- iniconfig-2.1.0.dist-info
- packaging-26.0.dist-info
- pip-21.2.4.dist-info
- pluggy-1.6.0.dist-info
- pydantic-2.12.5.dist-info
- pydantic_core-2.41.5.dist-info
- pygments-2.19.2.dist-info
- pytest-8.3.4.dist-info
- python_dotenv-1.2.1.dist-info
- pyyaml-6.0.3.dist-info
- setuptools-58.0.4.dist-info
- starlette-0.41.3.dist-info
- tomli-2.4.0.dist-info
- typing_extensions-4.15.0.dist-info
- typing_inspection-0.4.2.dist-info
- uvicorn-0.32.1.dist-info
- uvloop-0.22.1.dist-info
- watchfiles-1.1.1.dist-info
- websockets-15.0.1.dist-info
- frontend/package-lock.json contains 226 package entries (packages map size).
- frontend/node_modules is present locally but not tracked (ignored by .gitignore).
- minetest-mods/ exists as a top-level folder but is empty at snapshot time.

8) TEST/VALIDATION SNAPSHOT
---------------------------
Commands executed during this documentation pass:
- backend: pytest -q
  - Result: exit code 5 (no tests collected)
- frontend: npm run test
  - Result: 3 tests total, 2 passed, 1 failed
  - Failing test: frontend/src/pages/CreatePage.test.tsx
  - Immediate mismatch: test searches button name /create + generate/i but UI exposes button aria-label=Send
  - Additional stale expectations in this test reference legacy text that no longer matches current CreatePage UX

9) IMPORTANT OBSERVATIONS
-------------------------
- Game storage supports two formats simultaneously (flat HTML legacy + folderized metadata format).
- skyline-surge-3d exists both as a flat legacy file and as folderized game with index.html/game.json.
- One generated game folder (games/game-20260205222514/) is still placeholder-only (14-line index page).
- Frontend and backend integration path is clean via Vite proxy to FastAPI static + API mounts.
- Root .venv in git significantly increases repository weight and tracked file volume.

10) APPENDIX A - COMPLETE TRACKED FILE MANIFEST (EXCLUDING .venv)
-----------------------------------------------------------------
Format: path | line_count | byte_count
.DS_Store | 0 | 6148
.agents/skills/vibecode-canvas-arcade/SKILL.md | 68 | 3342
.agents/skills/vibecode-canvas-arcade/agents/openai.yaml | 4 | 259
.agents/skills/vibecode-canvas-arcade/assets/templates/arcade-single-file-template.html | 379 | 9425
.agents/skills/vibecode-canvas-arcade/references/framework-signature.md | 86 | 2913
.agents/skills/vibecode-canvas-arcade/references/genre-recipes.md | 74 | 2144
.agents/skills/vibecode-canvas-arcade/references/quality-gates.md | 32 | 1197
.agents/skills/vibecode-game-card-image/SKILL.md | 66 | 2067
.agents/skills/vibecode-game-card-image/agents/openai.yaml | 4 | 233
.agents/skills/vibecode-game-card-image/references/prompt-template.md | 7 | 290
.agents/skills/vibecode-game-card-image/scripts/create_game_card.py | 54 | 1747
.gitignore | 16 | 193
.system/.codex-system-skills.marker | 1 | 17
.system/skill-creator/SKILL.md | 377 | 19058
.system/skill-creator/agents/openai.yaml | 5 | 183
.system/skill-creator/assets/skill-creator-small.svg | 3 | 1319
.system/skill-creator/assets/skill-creator.png | 13 | 1563
.system/skill-creator/license.txt | 202 | 11358
.system/skill-creator/references/openai_yaml.md | 43 | 2130
.system/skill-creator/scripts/generate_openai_yaml.py | 225 | 6614
.system/skill-creator/scripts/init_skill.py | 397 | 14483
.system/skill-creator/scripts/quick_validate.py | 101 | 3293
.system/skill-installer/LICENSE.txt | 202 | 11358
.system/skill-installer/SKILL.md | 58 | 3366
.system/skill-installer/agents/openai.yaml | 5 | 221
.system/skill-installer/assets/skill-installer-small.svg | 3 | 923
.system/skill-installer/assets/skill-installer.png | 4 | 1086
.system/skill-installer/scripts/github_utils.py | 21 | 659
.system/skill-installer/scripts/install-skill-from-github.py | 308 | 10096
.system/skill-installer/scripts/list-skills.py | 107 | 2967
README.md | 42 | 882
ai.js | 400 | 10747
backend/README.md | 27 | 745
backend/app/__init__.py | 3 | 67
backend/app/main.py | 116 | 3924
backend/app/models.py | 55 | 1104
backend/app/prompting.py | 111 | 3220
backend/app/run_manager.py | 468 | 15057
backend/app/settings.py | 29 | 769
backend/app/storage.py | 277 | 9824
backend/requirements.txt | 5 | 86
frontend/index.html | 15 | 597
frontend/index.html.local-backup-20260205-123823 | 12 | 301
frontend/package-lock.json | 3192 | 109160
frontend/package.json | 29 | 687
frontend/src/App.tsx | 16 | 503
frontend/src/components/GameCard.tsx | 28 | 1015
frontend/src/lib/api.ts | 50 | 1611
frontend/src/main.tsx | 14 | 331
frontend/src/pages/CreatePage.test.tsx | 88 | 2616
frontend/src/pages/CreatePage.tsx | 277 | 8623
frontend/src/pages/HomePage.test.tsx | 37 | 986
frontend/src/pages/HomePage.tsx | 97 | 2918
frontend/src/pages/PlayPage.test.tsx | 36 | 980
frontend/src/pages/PlayPage.tsx | 61 | 1553
frontend/src/styles.css | 515 | 8208
frontend/src/test/setup.ts | 1 | 43
frontend/src/types/index.ts | 27 | 470
frontend/tsconfig.json | 18 | 442
frontend/vite.config.ts | 17 | 345
game-build-orchestrator/SKILL.md | 126 | 5709
game-build-orchestrator/agents/openai.yaml | 4 | 318
game-build-orchestrator/references/build-mode-routing.md | 28 | 1147
game-build-orchestrator/references/canvas-feasibility-rubric.md | 34 | 1391
game-build-orchestrator/references/opponent-ai-routing.md | 25 | 1045
game-build-orchestrator/references/webgl-feasibility-rubric.md | 34 | 1494
games/.DS_Store | 0 | 6148
games/asteroid-shepherd.html | 1208 | 33429
games/brickfall-arena.html | 940 | 29745
games/flappybird.html | 684 | 19875
games/game-20260205211554/card.png | 33 | 15947
games/game-20260205211554/game.json | 5 | 166
games/game-20260205211554/index.html | 844 | 24825
games/game-20260205214346/game.json | 5 | 171
games/game-20260205214346/index.html | 675 | 19144
games/game-20260205222112/game.json | 5 | 165
games/game-20260205222112/index.html | 781 | 23883
games/game-20260205222514/game.json | 5 | 165
games/game-20260205222514/index.html | 14 | 438
games/game-20260205223020/game.json | 5 | 165
games/game-20260205223020/index.html | 797 | 24125
games/grid-chase.html | 1645 | 47460
games/minecraft-clone.html | 2093 | 66374
games/neon-drift.html | 840 | 25171
games/neon-godge/game.json | 5 | 153
games/neon-godge/index.html | 586 | 16711
games/skyline-surge-3d.html | 1325 | 43540
games/skyline-surge-3d/game.json | 5 | 165
games/skyline-surge-3d/index.html | 1325 | 43540
games/subwaysurfer.html | 755 | 22942
games/webgl-lane-dodger.html | 649 | 19121
games/zombieshooter.html | 655 | 19499
phaser-gamedev/SKILL.md | 101 | 4363
phaser-gamedev/references/arcade-physics.md | 436 | 9506
phaser-gamedev/references/core-patterns.md | 453 | 9408
phaser-gamedev/references/performance.md | 408 | 8171
phaser-gamedev/references/spritesheets-nineslice.md | 427 | 13896
phaser-gamedev/references/tilemaps.md | 965 | 24485
playwright-testing/SKILL.md | 151 | 8333
playwright-testing/references/flake-reduction.md | 41 | 1439
playwright-testing/references/phaser-canvas-testing.md | 84 | 3656
playwright-testing/references/playwright-mcp-cheatsheet.md | 51 | 2206
playwright-testing/scripts/imgdiff.py | 63 | 1706
playwright-testing/scripts/with_server.py | 140 | 4319
vibecode-canvas-arcade/SKILL.md | 127 | 5145
vibecode-canvas-arcade/agents/openai.yaml | 4 | 392
vibecode-canvas-arcade/references/quality-gates.md | 34 | 1492
vibecode-opponent-ai/SKILL.md | 65 | 3178
vibecode-opponent-ai/agents/openai.yaml | 4 | 270
vibecode-opponent-ai/assets/templates/opponent-ai-brief.md | 64 | 954
vibecode-opponent-ai/references/technique-playbook.md | 45 | 1872
vibecode-webgl-arcade/SKILL.md | 174 | 7793
vibecode-webgl-arcade/agents/openai.yaml | 4 | 759
vibecode-webgl-arcade/assets/templates/webgl-single-file-template.html | 570 | 16939
vibecode-webgl-arcade/references/framework-signature.md | 74 | 2460
vibecode-webgl-arcade/references/genre-recipes.md | 87 | 2587
vibecode-webgl-arcade/references/quality-gates.md | 36 | 1660

11) APPENDIX B - TRACKED .venv FOOTPRINT
-----------------------------------------
- Tracked .venv files: 1748
- Tracked .venv byte total: 31189094
- Detailed .venv file list omitted from body due size; use: git ls-files .venv
