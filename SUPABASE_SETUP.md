# Supabase setup — Google, Apple, Phone, Email

The backend now runs on **Supabase** (Postgres + Auth + Realtime). It stays dormant until you create a project and provide its URL + anon key. Guests still work fully offline with no account.

Work top to bottom. Steps 1–4 light up Google + email. Phone and Apple have extra requirements called out below.

---

## 1. Create the Supabase project (3 min)

1. Go to https://supabase.com → sign in → **New project**.
2. Name it `smoking-tracker`, set a strong database password (save it), pick a region near your users (e.g. Mumbai for India). Create — it provisions in ~2 min.

## 2. Give the app its keys

1. In the project, open **Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.
3. Provide them to the app one of two ways:
   - **Quick:** open `src/lib/supabase-config.js` and the build picks up `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Easiest is to create a `.env` file in the project root:
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
     ```
   - For the **GitHub Pages deploy**, add the same two as repository variables and pass them into the Actions build step.

The anon key is **public by design** — it's safe in client code. Row-Level Security (next step) is what actually protects the data.

## 3. Create the tables + security (2 min)

1. Open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` from the repo and **Run**.
3. This creates `cigarettes` and `settings`, turns on Row-Level Security so each user can only touch their own rows, and enables Realtime on both tables.

---

## 4. Turn on the sign-in providers

**Authentication → Providers.**

### Google (free, easiest)
1. In Google Cloud Console, create an **OAuth 2.0 Client ID** (Web application). Add the **Authorized redirect URI** Supabase shows you on the Google provider page (it looks like `https://xxxx.supabase.co/auth/v1/callback`).
2. Paste the Google **Client ID** and **Client secret** into Supabase → Google → Enable. Save.

### Email magic link (free)
1. Enable the **Email** provider (on by default). No extra setup — magic links use Supabase's built-in mailer for testing. For production volume, set up a custom SMTP under **Authentication → Settings → SMTP**.

### Redirect URLs (all providers)
**Authentication → URL Configuration → Redirect URLs**, add:
- `http://localhost:5173` (local dev)
- `https://aneeshk-ds.github.io/smoking-tracker/` (live site)
Also set the **Site URL** to your live URL.

---

## 5. Phone OTP (needs an SMS provider)

Supabase doesn't send SMS itself — you connect a provider.

1. Create an account with **Twilio** (or Vonage / MessageBird / Textlocal). In Twilio, get an **Account SID**, **Auth Token**, and either a **Messaging Service SID** or a sending number.
2. Supabase → **Authentication → Providers → Phone → Enable**, choose **Twilio**, paste those credentials. Save.
3. Cost: a few cents per SMS — set spending limits in Twilio.
4. Test cheaply: Twilio trial numbers, or Supabase's **test OTP** option, let you verify without real spend.

---

## 6. Apple / iCloud (needs Apple Developer account)

"Sign in with Apple" needs the paid **Apple Developer Program ($99/yr)**. The code is ready; this is console work.

In the **Apple Developer** portal:
1. **Identifiers → App ID:** enable the **Sign In with Apple** capability.
2. Create a **Services ID** (your web client). Configure it:
   - **Domains:** `xxxx.supabase.co`
   - **Return URLs:** `https://xxxx.supabase.co/auth/v1/callback`
3. **Keys:** create a key with **Sign In with Apple** enabled, download the `.p8`. Note the **Key ID** and your **Team ID**.

Then Supabase → **Authentication → Providers → Apple → Enable** and provide the **Services ID**, **Team ID**, **Key ID**, and the **.p8** key contents. Save.

---

## 7. Test (5 min)

1. `npm install` then `npm run dev`.
2. Open **Settings → Account**.
3. Try **Continue with Google** first (least setup), then email, then phone, then Apple.
4. Log a cigarette, sign in on a second browser with the same account, confirm it appears — that verifies cloud sync + realtime + the guest→account migration.

---

## How it behaves (already built)

- **Guest by default:** no account = 100% on-device. Privacy intact.
- **Sign in = opt-in cloud:** first sign-in pushes existing local data up automatically (the `reconcile()` migration in `sync.js`).
- **Sync model:** offline-first, last-write-wins by `updated_at`, realtime across devices via Postgres changes.
- **OAuth uses redirect** (not popup): Google/Apple bounce out and back to your app URL; the session is detected automatically on return. Make sure your app URL is in the Redirect URLs list (step 4).

## Data model

Two tables, documents stored as JSONB so the client can evolve without migrations:
- `cigarettes(id, user_id, data jsonb, updated_at, deleted)`
- `settings(user_id, data jsonb, updated_at)`
RLS ties every row to `auth.uid()`. Full DDL in `supabase/schema.sql`.

## Cleanup note

`src/lib/firebase.js` and `firebase-config.js` are now empty stubs (the sandbox couldn't delete them). Delete them from your local clone — nothing imports them anymore.
