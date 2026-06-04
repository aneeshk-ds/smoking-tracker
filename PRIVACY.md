# Privacy

Last updated June 2026. This app helps you track and reduce smoking. It is not a
standalone phone-only app: when you create an account, your data syncs to the
cloud so it survives a phone change.

## Guest mode (default)
On first open you are a guest. Everything you log stays on your device and is
never sent anywhere. Nothing is backed up. If you lose or reset the device,
guest data is gone.

## When you create an account
To keep data safe across phone changes, sign in with a phone number (default) or
email. Your logs and settings are then copied to a private cloud space tied to
your account, hosted on Google Firebase, and synced across your devices.

## What we store
Cigarette log entries (time, brand, cost, and any optional mood or trigger notes
you add), your goal and target, your brand and price settings, and the sign-in
identifier you choose (phone number or email).

## What we do not do
We do not sell your data, show ads, or share your data with third parties for
marketing. The phone number or email is used only to sign you in and sync data.

## Phone number and SMS
If you sign in by phone, a one-time code is sent by SMS through Firebase
Authentication to confirm the number is yours. The number is stored only as your
account identifier.

## Security
Data in transit is encrypted with HTTPS. Data at rest is encrypted on Google's
servers. Security rules ensure only your signed-in account can read or write your
data.

## Deleting your data
Settings > Delete all data clears the device and your cloud copy. Removing your
account removes the cloud copy permanently.
