# How to get the GitHub data to paste (dummy-proof)

The app needs one file: **evidence.json**. Not raw.json. Not a screenshot. Not the token. The file named **evidence.json** that you create in Step 2 below.

---

## Easiest: Sign in with GitHub (in the app)

1. Open the app and go to the **Generate** page.
2. Click **“Connect (public repos only)”** or **“Connect (include private repos)”** to sign in with GitHub.
3. Choose your date range and click **“Fetch my data”**. The app fetches your PRs and reviews in the background; when it’s done, the evidence JSON will appear in the text area.
4. Click **“Generate review”**.

Your token is never stored; we only use it during the session. You can also use a Personal Access Token or the CLI (below) if you prefer.

---

## Step 1: Get a GitHub token (for CLI or paste-in-app)

1. Click this link: **https://github.com/settings/tokens**
2. Click **“Tokens (classic)”** in the left sidebar (not “Fine-grained tokens”).
3. Click the green **“Generate new token”** → **“Generate new token (classic)”**.
4. **Note:** type anything (e.g. `AnnualReview`). **Expiration:** pick what you want.
5. **Scopes:** tick the box for **`repo`** (that will tick all 4 repo sub-boxes). If you only use public repos you can tick only **`public_repo`**.
6. Scroll down, click **“Generate token”**.
7. **Copy the token immediately.** It looks like `ghp_xxxxxxxxxxxxxxxxxxxx`. You cannot see it again after you leave the page.
8. Paste it somewhere safe for the next step (e.g. a temporary file or password manager). **Do not commit it or share it.**

---

## Step 2: Create evidence.json on your machine

Do this in a terminal, in the **root folder of this repo** (the folder that contains `package.json`).

### 2a. Collect (fetch your PRs from GitHub)

Run this **one line** in the terminal. Replace **only** the part that says `PUT_YOUR_TOKEN_HERE` with your actual token (the `ghp_...` string). Leave the rest exactly as is, including the dates if you want Jan 1–Dec 31 of 2025.

```bash
GITHUB_TOKEN=PUT_YOUR_TOKEN_HERE yarn collect --start 2025-01-01 --end 2025-12-31 --output raw.json
```

- **Wrong:** `GITHUB_TOKEN = ghp_xxx` (no spaces around `=`)
- **Wrong:** Forgetting the token and running `yarn collect` without `GITHUB_TOKEN=...` (it will say “GITHUB_TOKEN required”)
- **Right:** One continuous line: `GITHUB_TOKEN=ghp_YourActualTokenHere yarn collect --start 2025-01-01 --end 2025-12-31 --output raw.json`

**Checkpoint:** The command should finish without errors. You should see “Wrote raw.json” (or similar). There will now be a file called **raw.json** in the repo root. You do **not** paste this file into the app.

### 2b. Normalize (turn raw.json into evidence.json)

Run this **one line**:

```bash
yarn normalize --input raw.json --output evidence.json
```

**Checkpoint:** No errors. You now have a file named **evidence.json** in the repo root. **This is the file you paste or upload.** Not raw.json.

**Different date range?** In 2a, change only `2025-01-01` and `2025-12-31` to your start and end dates (YYYY-MM-DD). Then run 2a, then 2b again.

---

## Step 3: Put that data into the app

1. Open the app and go to the **Generate** page (“Generate my review”).
2. Use **one** of these:
   - **Upload:** Click **“Upload evidence.json”** and choose the file **evidence.json** from the repo root (the one you made in Step 2b).  
   - **Paste:** Open **evidence.json** in a text editor, Select All, Copy, then click in the big text box on the Generate page and Paste.
3. Click **“Generate review”**.

**Wrong:** Pasting or uploading **raw.json** — the app will complain about invalid JSON or missing “contributions”. It must be **evidence.json**.

---

## If something breaks

| What you see | What to do |
|--------------|------------|
| `GITHUB_TOKEN required` | You didn’t set the token. Run the 2a command again with `GITHUB_TOKEN=ghp_...` at the start (no spaces around `=`). |
| `--start` / `--end` required | You didn’t pass dates. Use the full 2a command including `--start 2025-01-01 --end 2025-12-31` (or your dates). |
| `Invalid JSON` or missing “contributions” in the app | You pasted **raw.json**. Use **evidence.json** (the file from `yarn normalize`). |
| `yarn: command not found` | Install Node and Yarn, then run the commands from the repo root. |
| No `evidence.json` after 2b | Run 2a first (so `raw.json` exists), then run 2b again. |

---

**TL;DR (CLI):** Token from GitHub → run 2a (collect) → run 2b (normalize) → upload or paste **evidence.json** in the app. Not raw.json.  
**TL;DR (app):** Sign in with GitHub on the Generate page → Fetch my data → Generate review.
