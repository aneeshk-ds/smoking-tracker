# Firebase setup (one-time, ~15 minutes)

The app ships in local-only mode. Accounts and cloud sync turn on once you
create a Firebase project and paste its config. None of these steps need code.

## 1. Create the project
1. Go to https://console.firebase.google.com and click Add project.
2. Name it (for example smoking-tracker), accept defaults, create.

## 2. Register a web app and copy the config
1. In Project overview, click the web icon (</>) to add a web app.
2. Give it a nickname, register. Firebase shows a firebaseConfig object.
3. Copy those values into src/lib/firebase-config.js (apiKey, authDomain,
   projectId, storageBucket, messagingSenderId, appId). These are not secrets.

## 3. Enable sign-in methods
1. Build > Authentication > Get started.
2. Sign-in method tab: enable Phone and Email/Password (or Email link).
   - For Email link (passwordless), under Email/Password enable the
     Email link (passwordless sign-in) toggle.
3. Settings > Authorized domains: add your live domain
   aneeshk-ds.github.io (localhost is allowed by default for testing).

## 4. Enable billing for phone SMS
Phone OTP needs the Blaze (pay-as-you-go) plan.
1. In the console footer, click Upgrade and switch the project to Blaze.
2. Add a billing account. SMS costs are small per message; set a budget alert.
   Without Blaze, phone sign-in will not send codes (email still works).

## 5. Create the Firestore database
1. Build > Firestore Database > Create database.
2. Start in production mode, pick a region close to your users.
3. Open the Rules tab, paste the contents of firestore.rules, Publish.

## 6. Test
1. Run npm install then npm run dev.
2. Open Settings > Account > Sign in. Try phone first, then email.
3. Log a cigarette, sign in on a second browser, confirm it appears.

## Notes
- For phone testing without spending on SMS, add test numbers under
  Authentication > Sign-in method > Phone > Phone numbers for testing.
- reCAPTCHA is handled automatically (invisible) by the phone flow.
