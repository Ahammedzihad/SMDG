
# SECONDARY MASTER INSTRUCTION
# PROJECT SKILLS, VIBE CODING MASTERCLASS & ASSET MANAGEMENT

PROJECT: NASA SPACE MISSION DESIGN GAME
DEVELOPMENT ENVIRONMENT: GOOGLE ANTIGRAVITY
ROLE: CONTINUOUS AI DEVELOPMENT PARTNER

==================================================
0. PURPOSE AND PRIORITY
==================================================

These are persistent secondary development instructions.

They supplement the main NASA Space Mission Design Game implementation prompt.

They do not replace the main project requirements.

You must combine the following references whenever working on this project:

1. Main project implementation requirements.
2. Available project skills inside the .agents directory.
3. Nick Sarev's Vibe Coding Masterclass transcript.
4. The latest ORBITONE_ASSETS.md file.
5. Existing project architecture, code and documentation.
6. NASA scientific and technical requirements.

IMPORTANT PRIORITY ORDER:

1. Scientific accuracy, security and project correctness.
2. Main project requirements.
3. Relevant project-specific skills and instructions.
4. Relevant masterclass principles.
5. Asset reuse and implementation preferences.
6. Convenience and speed.

If two instructions conflict, follow the higher-priority requirement and explain the conflict when relevant.

==================================================
1. MANDATORY SKILL DISCOVERY AND APPLICATION
==================================================

The project contains various development skills inside a directory named:

.agents

These skills are important resources for guiding your development process.

You MUST inspect and use the relevant skills whenever generating outputs or performing development tasks.

This is not a one-time operation.

It applies to EVERY new task and development conversation.

A. INITIAL SKILL DISCOVERY

At the beginning of the project or a new conversation:

1. Locate the .agents directory.
2. Inspect its directory structure.
3. Identify all available skills.
4. Identify their descriptions, purposes and intended use cases.
5. Read the relevant skill instructions.
6. Understand what each skill expects you to do.
7. Identify dependencies or references to additional documentation.

Do not assume that all skills have the same directory structure.

Inspect the actual files.

B. BEFORE EVERY NEW TASK

Before producing an implementation, plan, prompt, code modification, debugging solution, review, or other development output:

1. Understand the user's current task.
2. Inspect the available skills in .agents.
3. Identify which skills are relevant to that specific task.
4. Read the complete instructions of those relevant skills.
5. Read any additional reference files required by those skills.
6. Apply their relevant procedures and constraints.
7. Generate the requested output.

Examples:

- UI development: inspect and use relevant frontend, UI/UX and design skills.
- Three.js development: inspect relevant 3D, graphics and animation skills.
- Backend development: inspect relevant backend and API skills.
- Git operations: inspect relevant Git and version-control skills.
- Debugging: inspect relevant debugging and code-review skills.
- Security: inspect relevant security and validation skills.
- Documentation: inspect relevant documentation skills.
- NASA data integration: inspect relevant data analysis and scientific computing skills, if available.
- Prompt generation: inspect relevant prompt engineering or agent workflow skills, if available.

These are examples, not assumptions about which skills exist.

C. SKILL APPLICATION RULES

- Do not merely list the available skills.
- Actually read and apply the relevant instructions.
- Do not assume a skill was applied because it was used in an earlier conversation.
- Recheck skills when starting a new task.
- If a skill references another document, inspect that document when required.
- Do not invent skills or assume unavailable instructions.
- Do not blindly apply unrelated skills.
- Do not activate every skill unnecessarily.
- Prefer the most relevant skills rather than loading unrelated instructions.
- If a skill conflicts with project requirements, prioritize the project requirements.
- If a skill is unavailable or unreadable, report that limitation rather than pretending to have used it.

D. EVERY OUTPUT

The skill-review requirement applies to more than code generation.

Before generating any of the following, check the relevant skills:

- Development plans.
- Implementation prompts.
- Code.
- UI designs.
- 3D asset integration.
- Debugging solutions.
- Architecture decisions.
- Code reviews.
- Security audits.
- Documentation.
- Testing plans.
- Deployment instructions.
- Refactoring proposals.

Do not make this a superficial checklist. The relevant skill instructions must materially influence the quality and correctness of the output.

E. EFFICIENCY

Do not repeatedly reread every skill in full if its unchanged contents have already been inspected in the current working context.

However:
- Recheck the available skill list before each new task.
- Re-read relevant instructions when their contents may have changed, when context is missing, or when a task requires details not previously inspected.
- Always inspect newly supplied or modified skill files.

==================================================
2. NICK SAREV — VIBE CODING MASTERCLASS
==================================================

REFERENCE:

Title: Vibe Coding Masterclass
Instructor: Nick Sarev
YouTube:
https://youtu.be/gcuR_-rzlDw

I will provide the transcript or the supplied study notes from this masterclass.

Treat the actual supplied transcript and notes as important references for our AI-assisted development workflow.

A. TRANSCRIPT READING

When the transcript is available:

1. Read the complete supplied material.
2. Extract the instructor's actual recommendations.
3. Identify the development workflows and techniques.
4. Understand the reasoning behind the recommendations.
5. Identify the practices relevant to our project.
6. Apply those practices during subsequent development tasks.

Do not invent missing transcript content.

Do not attribute general programming advice to Nick Sarev unless supported by the supplied material.

If a new conversation does not contain the transcript or its accessible project reference, request it instead of pretending to remember its exact contents.

B. IMPORTANT MASTERCLASS PRINCIPLES

The supplied study notes identify the following practices as particularly relevant.

1. RULES AND WORKFLOWS

Use persistent project instructions and reusable workflows for recurring development requirements.

Avoid repeatedly explaining the same conventions in every prompt.

2. PLANNING BEFORE STRUCTURAL CHANGES

For substantial changes:
- Inspect the existing architecture.
- Understand the requirements.
- Develop an implementation plan.
- Identify dependencies and risks.
- Then implement.

Use fast execution for small, well-understood changes.

Do not skip planning for major architectural modifications.

3. ITERATIVE DEVELOPMENT

Build in manageable stages.

Prefer:
- Small implementation steps.
- Frequent verification.
- Targeted fixes.
- Reuse of existing components.
- Continuous testing.

Avoid large uncontrolled changes.

4. DESIGN INSPIRATION

When appropriate, use concrete visual references instead of vague instructions.

If I provide screenshots or references:
- Inspect their layout.
- Identify the design language.
- Extract relevant colors, typography and component patterns.
- Apply the inspiration without blindly copying unrelated functionality.

5. BUILD FUNCTIONALITY BEFORE UNNECESSARY COMPLEXITY

Use a deliberate implementation sequence.

For our project, prioritize:
- Working application.
- Functional mission loop.
- Correct engineering calculations.
- NASA data integration.
- Testing.
- Visual refinement.

Do not introduce unnecessary infrastructure.

6. LOCAL TESTING AND INTEGRATION

Follow a practical development pipeline:

Local development → Integration/testing → Staging, if available → Production.

Verify the actual application after integration.

Do not assume that a successful local build guarantees a successful deployment.

7. SECURITY AND VALIDATION

Pay particular attention to:

- Exposed API keys and environment variables.
- Server-side validation.
- Trust boundaries between browser and server.
- Dependency authenticity and security.
- Authentication and authorization where applicable.
- Database access controls if a database is introduced.

Never trust client-side validation alone for security-sensitive operations.

Verify package names and dependencies before installing them.

8. MULTI-AGENT DEVELOPMENT

When multiple developers or agents contribute:

- Define clear ownership.
- Avoid simultaneous edits to the same files.
- Agree on shared interfaces.
- Use Git branches.
- Commit changes regularly.
- Review and integrate changes deliberately.

Avoid excessive parallel agents that create coordination overhead.

9. CONTEXT MANAGEMENT

For substantial development work, maintain an updates.md file or an equivalent existing project document.

Record significant:
- Architectural decisions.
- Implemented features.
- File changes.
- Dependencies.
- Known bugs.
- Testing results.
- Unfinished work.
- Integration requirements.

Keep the file concise and useful.

When handing work to a new agent or conversation, use this record to communicate the actual project state.

Do not claim that work is complete merely because an earlier agent said so. Verify the code.

10. PERFORMANCE

Watch for unnecessary repeated data fetching, expensive rendering, duplicate calculations and inefficient sequential operations.

Optimize only where a real bottleneck or meaningful performance concern exists.

C. IMPORTANT LIMITATIONS

The masterclass demonstrates several specific technologies and tools.

Do not automatically introduce:

- Next.js.
- Supabase.
- Stripe.
- Netlify.
- Claude Code.
- Additional databases.
- New frameworks.

Our existing project architecture takes priority.

Use a technology from the course only when it solves a genuine project requirement.

The course also contains anecdotal financial claims, statistics and tool pricing.

Do not treat those as verified facts or repeat them as scientific evidence.

D. CONTINUOUS APPLICATION

The transcript is not just for one-time summarization.

Use its relevant principles throughout the project:

- Planning.
- Prompting.
- Implementation.
- Debugging.
- Testing.
- Code review.
- Context handoff.
- Git collaboration.

==================================================
3. ORBITONE_ASSETS.MD — CENTRAL ASSET REFERENCE
==================================================

I will provide a Markdown file named:

ORBITONE_ASSETS.md

This file contains the directory paths and references to our available game assets.

It is the central asset inventory for this project.

A. MANDATORY ASSET DISCOVERY

Whenever an asset is needed, inspect ORBITONE_ASSETS.md FIRST.

This includes:

- Spacecraft.
- Satellites.
- Rockets.
- Astronauts.
- Characters.
- Planets.
- Celestial bodies.
- Space environments.
- Space stations.
- Textures.
- Materials.
- HDRI files.
- Icons.
- UI graphics.
- Animations.
- Audio.
- Fonts.
- Other game resources.

Do not assume an asset is unavailable before checking this file.

B. ASSET INTEGRATION WORKFLOW

Whenever an asset is required:

1. Locate ORBITONE_ASSETS.md.
2. Read its latest supplied version.
3. Find the relevant asset entry.
4. Identify the exact path.
5. Verify that the file exists.
6. Inspect its format and compatibility.
7. Check scale, orientation, textures and materials where relevant.
8. Reuse the asset if suitable.
9. Integrate it into the existing architecture.
10. Verify that it loads and renders correctly.

C. STRICT RULES

- Never invent asset paths.
- Never assume a listed asset exists without checking.
- Never rename assets unnecessarily.
- Never duplicate existing assets unnecessarily.
- Never download replacements before checking the inventory.
- Never introduce unnecessary external asset dependencies.
- Preserve existing asset-loading mechanisms.
- Consider performance and file size.

If a listed asset is missing:
- Report the exact path.
- Do not fabricate a replacement path.

If no suitable asset exists:
- Explain what is missing.
- Recommend the simplest appropriate alternative.
- Search for or download a replacement only when necessary.

==================================================
4. REPEATED FILE AVAILABILITY AND VERSION CONTROL
==================================================

I intend to provide ORBITONE_ASSETS.md in every relevant development conversation.

Therefore:

- Treat the latest supplied version as authoritative.
- Reinspect it whenever a new version is supplied.
- Do not rely blindly on older paths.
- Do not repeatedly request a file already available in the current conversation.
- If it is unavailable, ask me to provide it before making assumptions about asset locations.

The same principle applies to the masterclass transcript.

If I provide updated study notes or a corrected transcript, use the latest supplied version.

==================================================
5. HOW TO COMBINE THE THREE REFERENCES
==================================================

Before beginning any development task, use the following sequence:

STEP 1 — UNDERSTAND THE TASK

Identify:
- What exactly needs to be achieved?
- Which subsystem is involved?
- What existing functionality might be affected?

STEP 2 — CHECK THE PROJECT SKILLS

- Inspect .agents.
- Identify relevant skills.
- Read their instructions.
- Apply their requirements.

STEP 3 — CHECK THE MASTERCLASS REFERENCE

- Consult the supplied transcript or study notes.
- Identify applicable development principles.
- Avoid irrelevant techniques.

STEP 4 — CHECK ASSETS

If the task involves assets:
- Inspect ORBITONE_ASSETS.md.
- Verify the actual files.
- Prefer existing assets.

STEP 5 — INSPECT EXISTING IMPLEMENTATION

- Review the relevant code.
- Identify reusable components.
- Check existing interfaces.
- Avoid duplicate implementations.

STEP 6 — PLAN AND IMPLEMENT

Choose the smallest reliable implementation.

For structural work:
- Plan first.
- Identify affected files.
- Consider integration risks.

For small changes:
- Make the targeted modification directly.

STEP 7 — VERIFY

- Run relevant tests.
- Check the build.
- Verify actual behavior.
- Report untested features honestly.

==================================================
6. CONTINUITY BETWEEN ANTIGRAVITY CONVERSATIONS
==================================================

We may continue development through multiple conversations and agents.

At the beginning of every new conversation:

1. Inspect the current repository state.
2. Read AGENTS.md and relevant project instructions.
3. Inspect the .agents skills directory.
4. Identify relevant skills for the current task.
5. Check whether the masterclass transcript is available.
6. Check whether ORBITONE_ASSETS.md is available.
7. Read updates.md or the existing development handoff document, if available.
8. Inspect the relevant implementation before changing anything.

Do not assume that a previous conversation completed its task successfully.

Verify actual files, code and functionality.

If an earlier conversation's context is missing:
- Use the repository as the source of truth.
- Read the available project documentation.
- Ask only for essential missing references.

Do not overwrite another developer's uncommitted changes.

Respect the existing Git branch and collaboration workflow.

==================================================
7. PROJECT-SPECIFIC DEVELOPMENT PRINCIPLES
==================================================

Throughout the project:

- Preserve the existing Three.js and TypeScript architecture.
- Reuse existing code and components.
- Reuse assets from ORBITONE_ASSETS.md.
- Apply relevant skills from .agents.
- Apply relevant principles from the masterclass transcript.
- Maintain scientific accuracy.
- Verify NASA data and calculations.
- Avoid unnecessary dependencies.
- Avoid uncontrolled refactoring.
- Maintain clear interfaces between subsystems.
- Test changes before reporting completion.

Never prioritize a quick-looking implementation over a technically correct one.

Never claim that a feature, asset, dataset, test or deployment works without verifying it.

==================================================
8. FINAL OPERATING PRINCIPLE
==================================================

You are a disciplined AI-assisted development partner.

For EVERY new task:

1. Check the available .agents skills.
2. Read and apply the relevant skill instructions.
3. Consult the Nick Sarev masterclass transcript.
4. Consult the latest ORBITONE_ASSETS.md whenever assets are involved.
5. Inspect the existing project before modifying it.
6. Follow the main NASA project requirements.
7. Implement the smallest reliable solution.
8. Verify the result.

These instructions remain active throughout the project.

Do not treat skills, the transcript or the asset inventory as optional references.

They are part of our development workflow.

START EACH TASK BY CHECKING THE RELEVANT PROJECT INSTRUCTIONS AND REFERENCES BEFORE GENERATING YOUR OUTPUT.




The Transcript Taken from That vibecoding COurse:
# Vibe Coding With Antigravity, Gemini & Claude Code — Study Notes

> **Source note:** No timestamps exist in the supplied transcript. The closing segment — an extended pitch for the speaker's own paid program ("Maker School," a money-back-guaranteed accountability course) and a podcast plug — was cut as sponsor content per your instructions. Specific financial claims, unsourced statistics, and prompting "hacks" are flagged inline as the speaker's own unverified statements, not established fact.

## Course Overview & Toolkit
- **Key concept:** The course combines three tools — Antigravity, Gemini 3.1 Pro, and Claude Code — to progress from a simple personal site to full-stack SaaS apps with auth, databases, and payments.
- **Stated roadmap:** toolkit setup → first product (personal site, deployed live) → authentication/security deep dive → second product (client dashboard with auth + database) → foundational software concepts (hosting, databases, frameworks, GitHub) → design deep dive → third product (lead-gen SaaS) → fourth product (AI thumbnail SaaS) → debugging/iteration techniques → fifth product (content-automation SaaS) → economics of vibe coding.
- **Named tools:** **Antigravity**, **Gemini 3.1 Pro**, **Claude Code**.
- **Claim** [self-reported, unverified in transcript]: speaker says he uses these tools daily to run "a business that does over $4 million a year in profit" and teaches "around 2,000 people."
- **Actionable takeaway:** Expect to set up and pay for more than one tool — this workflow treats authentication/security and foundational concepts as their own dedicated stages, not afterthoughts.

## Installing Antigravity, Gemini, and Claude Code
- **Key concept:** Antigravity is free and installs like a normal desktop app; Gemini access comes bundled once you sign in with a Google account. Claude Code is a separate paid subscription with no free tier.
- **Steps shown:** go to `anti-gravity.google`, download for your OS, install, then click **"login with Google"** to unlock Gemini as a model.
- **Claude Code pricing as stated:** Pro plan **$17/month**; Max plan **starting at $100/month** [unclear — check video: prices as quoted at recording time; may have changed].
- **Claim** [self-reported]: hiring an equivalent human developer would cost "$20,000 to $30,000 a month"; speaker says he gets "at least 100x ROI" spending about $200/month on Claude.
- **Actionable takeaway:** Budget for two separate costs — the IDE/agent tool (free here) and model subscription(s) — rather than assuming one sign-up covers everything.

## The Antigravity Interface
- **Key concept:** Three panes — file **Explorer** (left), file **editor** (middle), **agent chat** (right). The speaker says he rarely uses the middle pane since the AI handles most file-level work directly.
- **Example:** opening a project folder populates the Explorer; toggling **markdown preview** on a `.md` file renders `#`/`##` headers as formatted text instead of raw symbols.
- **Hotkeys mentioned:** `Cmd+Shift+L` (new conversation), standard OS tab-switching keys for cycling open files, `Cmd+E` (jump to editor/folder) [exact combos stated inconsistently — check video].
- **Actionable takeaway:** Don't feel obligated to read the generated code in the editor pane — treat agent chat as the primary workspace and the file explorer as a way to spot-check what changed.

## Customizing Agent Behavior: Rules, Workflows, MCP Servers
- **Key concept:** Three ways to steer behavior beyond a single prompt.
  - **Rules** — standing instructions (global or per-workspace) applied to every conversation; stored under an `agent/rules` folder. A workspace file literally named `gemini.md` is always auto-applied.
  - **Workflows** — reusable multi-step procedures ("similar to skills") the agent runs on demand, like a checklist/SOP.
  - **MCP servers** — pre-built, third-party-defined integrations (named examples: PostgreSQL/CloudSQL, Looker, GitHub, Neon, Stripe) that let the agent interact with those tools predictably.
- **Example rule** (quoted in part): *"Your role is to act as a world-class senior creative technologist and lead front-end engineer. you build high-fidelity cinematic one to one pixel perfect landing pages."*
- **Example workflow sketched:** a "code review" workflow referencing a security-practices document, making small incremental changes, and verifying with the user before anything goes to production.
- **Actionable takeaway:** Before repeating the same instructions across sessions (a design philosophy, a pre-deploy checklist), write it once as a rule or workflow file instead of re-typing it every time.

## Working With the Agent: Modes, Models, and Voice Input
- **Key concept:** Gemini conversations have two modes — **Planning** (forces the model to think and present a plan before touching files; auto-approve or manual-approve) and **Fast** (executes immediately; best for quick one-off edits).
- **Key concept:** Models are hot-swappable mid-project: **Gemini 3.1 Pro High**, **Gemini 3.1 Pro Low**, **Gemini 3 Flash**, **Sonnet 4.6**, **Opus 4.6**, and others, all selectable in the same chat window.
- **Speaker's own pattern:** Gemini 3.1 Pro High for design-heavy work; Claude/Opus for backend and cleanup.
- **Voice dictation:** a built-in mic transcribes speech to text, used because speaking (150–200 wpm) is faster than typing (50–80 wpm).
- **The "thinking" tab** shows the model's reasoning before its final answer — useful, per the speaker, for catching errors or spotting when a model is being lazy to save tokens.
- **Actionable takeaway:** Default to Planning mode for anything structural (new features/pages); reserve Fast mode for small, well-understood edits.

## Claude Code's Interface and Permission Modes
- **Key concept:** Claude Code runs as an extension inside Antigravity (or standalone); first use requires `/login`.
- **Four permission modes:** **Ask for edits** (confirm every change), **Edit automatically** (the speaker's default — no confirmation), **Plan mode** (think first, present a plan), and **Bypass permissions** (speaker calls this "yolo mode" — zero confirmations).
- **Model picker:** Opus 4.6 ("most capable for complex work"), Opus with 1M context, Sonnet, Sonnet with 1M context, Haiku, plus custom variants.
- **Observation:** the speaker finds Claude's "thinking" output more readable/interpretable in plain English than Gemini's — he says this matters especially for security review.
- **Actionable takeaway:** Use "Edit automatically" for routine work, but switch to "Plan mode" or "Ask for edits" before any change you're not confident about (authentication, payments, deletions).

## Build 1 — A Landing Page From a Screenshot (Leftclick)
- **Key concept:** Store a detailed style/role prompt as a `gemini.md` rule file, then simply say "build me a website" — the rule injects all design constraints automatically, every time.
- **Detail:** the rule included "aesthetic archetypes" and "structural typologies" (named examples: bento grids, split screens, infinite horizontal structures, linear narratives, application shell) that the model asks the user to choose between before building.
- **Example:** speaker supplied brand name, core thesis, differentiators, and conversion goal for a B2B brand called **Leftclick**; the model generated full landing pages from that single Q&A.
- **Iteration technique:** feed back a screenshot of an element you like from a *different* site (e.g., a navbar) plus a bundled list of specific changes in one message, rather than one change at a time.
- **Actionable takeaway:** Write your house style once as a rule file with explicit archetype/typology options, instead of re-describing design preferences in every new project.

## Deploying for Free With Netlify
- **Key concept:** A static site can go live for free by dragging the project folder onto a hosting provider's dashboard — no build pipeline required for an MVP.
- **Named tools:** **Netlify** (used throughout the course); **Vercel** mentioned as an alternative.
- **Example:** dragging a finished site folder into Netlify's "deploy manually" screen produced a live `*.netlify.app` URL in under a minute, confirmed by opening it on a phone.
- **Later upgrade:** the speaker switches to the **Netlify CLI** so the agent can push updates itself via an API key, instead of manually re-dragging folders each time.
- **Actionable takeaway:** For a pure static/no-backend site, drag-and-drop deployment is a legitimate way to ship an MVP — don't over-engineer the pipeline.

## The Security 80/20 for Vibe-Coded Apps
- **Key concept:** The speaker claims 80% of security problems in vibe-coded apps come from five gaps [his framing, not independently sourced in the transcript]:
  1. **Exposed environment variables and API keys** — secrets hardcoded into front-end code instead of a `.env` file.
  2. **Missing or broken Row Level Security (RLS)** on the database.
  3. **No server-side validation** — trusting the front end for logic an attacker can edit directly in the browser console.
  4. **Outdated or hallucinated packages** — AI sometimes invents a package name close to a real one (his example: "Acorns" vs. the real package "Acorn"); attackers register the fake name and fill it with malware.
  5. **Missing authentication middleware** — no server-side block on protected routes for logged-out users.
- **Definition — Row Level Security (RLS):** a database feature (via Supabase here) restricting each user to their own rows; off by default. Speaker claims **83% of exposed Supabase databases involved RLS misconfiguration** [unclear — check video: no source cited].
- **Named case study:** an open-source project the speaker calls "**OpenClaw**" (previously "Claudebot," described as having gone through "its 40th rebrand") reportedly had ~25,000 leaked API keys from these kinds of gaps [unclear — check video: figures stated without a source].
- **Actionable takeaway:** Keep a standing "security audit" prompt covering these five items, and run it in a *different* model/fresh context than the one that built the app — ideally before any public launch.

## The Vibe Coding Design Loop
- **Key concept:** The speaker's recommended build order for any full-stack app:
  1. Inspiration design (from Dribbble or Godly) — borrow a proven layout rather than designing from scratch.
  2. *(Optional)* Animate — turn a static inspiration asset into a short looping hero-section video.
  3. Build main functionality (dashboard/pages).
  4. Local testing/iteration with mock/JSON data — no real database yet.
  5. Push to a real database and retest.
  6. Add authentication **last** — by then the agent has full context of every route, so auth middleware correctly protects all of them (doing auth first risks protecting only the first page built).
  7. Deploy, then do an end-to-end retest.
- **Named stack** ("the usual suspects"): **Next.js** (framework), **Supabase** (database + auth), and a serverless host — **Netlify** in this course.
- **Actionable takeaway:** Deliberately sequence auth after core functionality, not before — presented as the single biggest structural mistake to avoid.

## Build 2 — A Full-Stack Client Dashboard (ContentOrb)
- **Key concept:** Splitting work between two models — one for planning/architecture, one for design/execution — produced better results than either alone.
- **Example planning prompt** (Claude Opus 4.6, Plan mode, quoted in part): *"You're a world-class website designer with 15 years of experience designing high quality, award-winning websites for Apple and Dribble. We'd like to build a full stack SAS client dashboard app for our content writing business. It's very important that you get this right. our career depends on it... SAS app should use superbase, Next.js and then tailwind.css. And we will deploy using netlifi... Then think extremely hard and generate a great plan."*
- **Claimed prompting trick:** including "our career depends on it" reportedly nudges output quality up slightly [speaker attributes this to a former OpenAI employee; presented as an unverified minor tip].
- **Workflow:** the comprehensive plan from Opus 4.6 plus a screenshot of an inspiration dashboard were both pasted into Gemini 3.1 Pro High, which then built the app.
- **Supabase setup steps:** create project at `database.new`; copy project URL/anon key/service role key into `.env`; paste the generated SQL migration into Supabase's SQL editor and run it; disable "confirm email" during testing to speed up the signup loop.
- **Security audit practice:** run in a *separate, fresh* Claude Code thread (not the one that built the app), deliberately with no prior context, so the review is unbiased.
- **Actionable takeaway:** Run the security audit in a new agent conversation, not the one that did the building — specifically to avoid the reviewer being influenced by its own prior design decisions.

## Foundational Concepts: Hosting and the Client-Server-Database Model
- **Key concept:** Three components interact in any web app — the **client** (your browser), the **server** (runs logic and validation), and the **database** (stores records — "like one big Google Sheet").
- **Key concept:** The standard pipeline is **local → staging → production** — test locally, then on an intermediate staging server, then push live; matters for safely coordinating multiple people/agents on one app.
- **Definition — hosting:** running your web app on a server (yours or someone else's) so others can reach it over the internet.
- **Examples named (general, not specifically recommended):** Hostinger, Bluehost, Cloudways, SiteGround.
- **Actionable takeaway:** Always retest a deployed app against its live production URL — the speaker stresses that local and production environments commonly behave differently (e.g., auth redirect URLs defaulting to `localhost`).

## Databases: SQL vs. NoSQL
- **Key concept:** Treat any database like a spreadsheet — tables ("sheets") with a header row (column names) and rows of data.
- **Definition — primary key:** a column guaranteed unique per row (e.g., an ID), so a query for one record can't accidentally return many.
- **Definition — SQL databases** (named examples: MySQL, PostgreSQL, SQLite): every row follows the same fixed column structure.
- **Definition — NoSQL databases** (named examples: MongoDB, Cassandra): each record can have its own distinct set of fields — more like a folder of varied documents than a fixed spreadsheet.
- **Actionable takeaway:** Default to SQL (Supabase/Postgres is used throughout this course) unless your data genuinely has no consistent shape across records.

## Languages, Frameworks, and Why Standardization Matters
- **Key concept:** Three core web languages — **HTML** (structure), **CSS** (style), **JavaScript** (interactivity). A framework is a standardized, opinionated way of combining all three.
- **Example:** the first website ever made (`info.cern.ch`, "the WorldWideWeb") is pure HTML with no CSS — used as a concrete illustration of "structure with zero styling."
- **Named frameworks:** **Next.js** (the course's main choice, built on React), **Vite**, **Vue**/**Nuxt.js** (Nuxt is built on top of Vue).
- **Key concept:** AI models were trained on large volumes of code using popular, standardized frameworks, so naming a well-known framework up front produces more reliable AI-generated output than requesting a bespoke structure.
- **Actionable takeaway:** Name a well-known, widely-used framework up front (e.g., Next.js) rather than letting the agent invent a custom architecture.

## Version Control and GitHub
- **Key concept:** Version control solves the "`essay_final_v3_ACTUALFINAL.docx`" problem — storing every change to a file (not just the latest copy) so you can view history, branch, and merge instead of manually renaming files.
- **Definition — GitHub repository:** a standardized, shareable workspace with full change history, letting multiple people (or agents) work on the same project without overwriting each other.
- **Example:** hosting providers like Netlify can pull directly from a connected GitHub repo and auto-rebuild on every push, instead of manually re-dragging a folder each time.
- **Actionable takeaway:** Once a project is more than a quick throwaway demo, push it to GitHub early so deployment can be automated and you have a rollback history if an agent makes a bad change.

## Multi-Agent Orchestration
- **Key concept:** The **Agent Manager** view lists every conversation across every workspace, plus an **Inbox** collecting every pending approval/question from all running agents in one place.
- **Key concept:** Multiple independent agent conversations ("playground" instances) can run in parallel on variants of the same idea; you compare results afterward and keep only the best.
- **Example:** the speaker ran four separate landing-page builds simultaneously from the same base prompt with minor variation, then kept the two or three he liked best and discarded the rest.
- **Caveat the speaker names:** this introduces **context-switching** costs (likened to monitoring multiple CCTV feeds); he recommends capping it at two or three parallel agents in practice, despite demonstrating four or five.
- **Actionable takeaway:** When unsure of a design direction, generate a few parallel variants at once instead of iterating serially — but cap it at two or three to stay manageable.

## Build 3 — A Lead-Generation SaaS That Wraps Third-Party APIs (Leadzo)
- **Key concept:** Most modern SaaS products are "wrappers" around one or more existing third-party APIs rather than fully original functionality — the differentiator is the UX/workflow stitched around them, not the underlying capability.
- **Named third-party services wrapped:** a scraping service referred to as "**Appify**" [transcript spelling is inconsistent; likely **Apify**] for lead scraping, and "**AnyMailFinder**" for email enrichment, plus Anthropic/OpenAI for AI-personalized outreach copy ("icebreakers").
- **Process:** sketch the planned pages/flow informally first (landing page → signup → config page for API keys → scrape-leads form → order history) *before* prompting the build, rather than prompting with no plan.
- **Example prompt fragment:** *"...here's some scrapers that I want you to wrap around"* — paired with pasted API documentation and a long voice-dictated description of required behavior (e.g., prioritize the Anthropic key over the OpenAI key if both are present).
- **Rate-limit workaround:** when Gemini hit a usage limit mid-build, the speaker had Claude summarize the existing context, then continued in a fresh Claude Code thread with "fast mode" until Gemini's limit reset.
- **Speed fix:** AI-personalization was slow because it processed 100 leads sequentially; the fix requested was simply "batch the requests" — i.e., parallelize the API calls instead of running them one at a time.
- **Actionable takeaway:** Paste the actual API documentation for any third-party service directly into the chat (via a "copy for LLM" feature if the provider offers one) rather than describing the API from memory.

## How Payments Actually Work (Stripe Architecture)
- **Key concept:** The monetization flow has five stages — sign up → routed to a payment page (plan or credits) → payment succeeds → app grants "entitlement" (access) → app tracks "consumption" (usage) → user routed back to payment once access/credits run out.
- **Definition — webhook:** an event notification a payment processor (**Stripe**, used throughout) sends to your backend (e.g., "payment succeeded") so your database can update a user's plan/credits automatically; you never handle raw card numbers.
- **Three monetization models named:** **one-time purchase** (pay once, access forever), **subscription** (recurring access, Stripe manages billing cycles), and **credit-based usage** (buy a bucket of credits, decrement per use, re-prompt at zero).
- **Stated transaction cost:** Stripe's cut is roughly **2.9% + $0.30 per transaction** [as stated by the speaker; check Stripe's site for current rates].
- **Three codebase components needed:** an endpoint creating a Stripe checkout session, a webhook endpoint listening for "payment succeeded," and a pre-action check confirming the user has a valid plan/enough credits.
- **Actionable takeaway:** Decide up front which of the three pricing models fits your product — this determines what you tell the agent to build, rather than improvising it mid-build.

## Build 4 — An AI Thumbnail Generator With Payments (Thumbly)
- **Key concept:** Extracting an exact design system (specific hex codes + font name) from an inspiration screenshot, rather than describing "make it look nice," produced much closer visual matches.
- **Example:** font **"Lufka"**, plus specific hex codes (primary `#F4E18E`, a greyscale accent set, white `#E3E3E3`, black `#043`) pulled directly from a Dribbble screenshot using an online color-picker tool.
- **Named tools for the core feature:** Google's **AI Studio** (`aistudio.google.com`) used to prototype a face-swap/thumbnail-edit flow with a model referred to as "**Nano Banana**," later wired into the app via API; a separate image-to-video model referred to as "**VO3**"/"**V3.1**" was used earlier for a hero-section animation [unclear — check video: likely Google's Veo video model, but transcript naming is inconsistent].
- **Generation pattern:** generate **three variants per request**, not just one, so the user picks a favorite rather than accepting a single AI output.
- **Performance bug and fix:** after adding payments/database, the app got noticeably laggier because every page load re-fetched all data instead of caching after sign-in; the fix requested was to cache on login and only refetch after an actual database write (mutation).
- **Actionable takeaway:** If an app gets newly slow right after adding a database, check whether every navigation is re-querying from scratch — ask the agent to cache on load and refetch only after writes.

## Build 5 — A Content Syndication SaaS and Context Management at Scale (Splinter)
- **Key concept:** For large builds, maintain an **`updates.md`** file where the agent logs every significant technical decision/change as it goes — specifically so a fresh model instance (or a different model entirely) can pick up the project from that file instead of re-deriving everything from scratch after a context/token limit is hit.
- **Key concept:** Don't mix models mid-thread — keep one model's context in one thread and another's in a separate thread; hand off via an explicit written summary, not by switching models cold inside the same chat.
- **Example of this pattern:** the speaker ran out of Gemini usage mid-build, had Claude Opus 4.6 generate a comprehensive catch-up prompt from the existing thread, then continued independently in a fresh Claude Code thread ("fast mode") until Gemini's limit reset.
- **Design-quality observation:** Gemini 3.1 Pro High produced higher visual/design quality; Claude Opus 4.6 was faster and arguably better at architecture/backend logic — his practice was to front-load design with Gemini, then hand backend/scripting to Claude.
- **Named tech stack:** Next.js 15, Tailwind CSS + the **shadcn/ui** component library, Supabase Realtime (live updates), **Zod** (validation).
- **AI-copy quality principle:** avoid "LLM-isms" — specifically, repeatedly alternating very short and very long sentences, and including hashtags or emojis in professional copy — stated as explicit negative constraints in the prompt.
- **Example integration:** connecting LinkedIn required registering for "Share on LinkedIn" and "Sign in with LinkedIn" (OpenID Connect) API access, adding an OAuth redirect URL in LinkedIn's developer settings, then updating that URL again after moving from `localhost` to the live production URL.
- **Minor note:** the hero-section generative particle background used a prompt technique the speaker credits to a "16-year-old" prompt engineer he calls "Leon," who reportedly shares such prompts publicly [attributed by speaker; not independently verified].
- **Actionable takeaway:** On any build large enough to risk running out of context, start an `updates.md`-style running log from the beginning — don't wait until you've already hit a limit to start documenting decisions.

## The Economics of Vibe Coding: Pricing and Marketing
- **Key concept:** The speaker's central claim is that **software is no longer a durable competitive advantage** because AI makes building cheap and fast for everyone; the moat has shifted to **distribution** — customer relationships, vendors, staff, and reach.
- **Definition — Value-Based Pricing (VBP):** pricing based on the value your product creates for the customer (direct expense savings + opportunity cost/revenue unlocked by freed-up time), rather than matching competitor prices.
- **Worked example given:** a thumbnail tool saving $1,000/month in direct costs (replacing a $50/thumbnail process at 20/month) plus an estimated $1,000/month in reclaimed time-value (cutting 2 hours to 5 minutes per thumbnail) = **$2,000/month in total value created**; pricing at roughly **10% of that value** suggests a **~$200/month** price point.
- **Suggested tiering approach:** set a top-tier price first (e.g., $200/month, ~10x customer ROI), a mid tier at about half price with slightly lower implied ROI (~8x), and an entry tier lower still (~6x) — tiers differentiated by value delivered, not just feature count.
- **Three marketing channels named:** **outbound** (cold email, cold DM — fastest but hardest, with returns that plateau over time), **inbound** (building an audience/content presence — slower to start but compounds), and **affiliate** (partnering with someone who already has an audience for a revenue share, e.g., "I'll pay you 30%").
- **Claim** [self-reported, unverified]: speaker says his own businesses collectively generate "over $300,000 a month in profit," and recommends spending roughly 95% of total effort on marketing versus ~5% on building.
- **Actionable takeaway:** Before building anything, calculate your product's value-based price (expense savings + time/revenue unlocked) using real numbers for a specific customer — rather than picking a price by copying a competitor's page.

---

## Overall Takeaways
- The course treats software-building speed as a solved problem and spends disproportionate time on sequencing (build order, auth-last, context logging) and verification (independent security audits, cross-model review) — the workflow discipline is arguably the real lesson, more than any single prompt.
- Several concrete, checkable practices are genuinely reusable outside this course: the five-point security checklist (env vars, RLS, server-side validation, dependency freshness, auth middleware), the SQL-vs-NoSQL mental model, and "auth last, not first."
- Specific numbers throughout — the 83% RLS-misconfiguration statistic, the ~25,000-leaked-keys case study, the "$4 million/year" and "$300,000/month" revenue claims, and the "100x ROI" figure — are stated as fact without a cited source in the transcript; treat them as the speaker's anecdotal claims, not verified data.
- The video closes with an extended pitch for the speaker's own paid program and podcast (cut from these notes per your instructions) — the "economics" module's advice is coherent on its own logic, but it is also the on-ramp to that sale.
- The "if you can explain it clearly, you can build it" framing is directionally true for prototypes, but every example in this transcript still needed dozens of iterative fixes, two models working in tandem, and real security remediation before anything was production-ready — "no code" here still meant hours of structured debugging and review.