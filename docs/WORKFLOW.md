# Workflows

How Sartre fits together and how a reader moves through it. Diagrams are Mermaid
(GitHub renders them). Keep this in step with the code when flows change.

## 1. Architecture

Routes are thin: both apps mount the same shared screens from `@sartre/app`.
Shared code never imports Firebase or Next/Expo directly.

```mermaid
flowchart TB
  subgraph Apps
    web["apps/web<br/>Next.js 16 · routes mount screens<br/>providers.tsx = web adapter"]
    mobile["apps/mobile<br/>Expo Router · _layout.tsx = native adapter"]
  end

  subgraph Shared["packages/app (screens + state)"]
    screens["Profile · Log · Rank · Card · Design<br/>SignIn · VerifyEmail · Username"]
    store["store.tsx<br/>in-memory library, mirrors Firestore shapes"]
    session["session.tsx<br/>auth state machine (data=firebase only)"]
    proto["Prototype + DevToolbar<br/>settings from URL query"]
  end

  core["packages/core<br/>types · ranking · scoring · stats · privacy · ulid"]
  ui["packages/ui + tokens<br/>primitives, themes, type scale"]
  data["packages/data<br/>BookProvider: OpenLibrary · Http · Mock"]
  mock["packages/mock<br/>fixture catalog, 1/4/30-book datasets"]
  fb["packages/firebase<br/>Backend interface over the JS SDK"]

  web --> screens
  mobile --> screens
  screens --> store & session & ui
  store --> core
  store --> data
  proto --> mock
  session --> fb

  data -- "web: /api/books proxy (cached)" --> ol[("Open Library")]
  fb --> auth[("Firebase Auth")]
  fb --> fs[("Firestore")]
  fb -. "off until Blaze plan" .-> st[("Cloud Storage")]
```

## 2. Sign-in and onboarding (`data=firebase`)

`session.tsx` derives the step from the signed-in user. Every Firestore write
requires a verified email, and the username is permanent.

```mermaid
stateDiagram-v2
  [*] --> loading
  loading --> signedOut: no user
  loading --> needsVerification: password account, email unverified
  loading --> needsUsername: verified, no users/{uid}
  loading --> ready: profile found
  loading --> error: Firestore unreachable (12s timeout)

  signedOut --> loading: Google popup / email + password
  signedOut --> signedOut: reset password (same reply either way)
  needsVerification --> loading: follows link, "I've verified"
  needsVerification --> needsVerification: resend email
  needsUsername --> ready: claim handles/{handle} + users/{uid} in one transaction
  ready --> signedOut: sign out
```

## 3. Logging and ranking a book

```mermaid
flowchart TD
  A["Log a book"] --> B["Search title/author<br/>(live Open Library or mock)"]
  B --> C["Pick work → choose edition<br/>(edition sets page count)"]
  C --> D{"Finished or Reading?"}
  D -- Reading --> R["Currently reading on profile<br/>check-ins update page"]
  R -- "Finish" --> E
  D -- Finished --> E["Pick bucket<br/>Loved · Liked · Meh"]
  E --> F{"Other books in bucket?"}
  F -- no --> H
  F -- yes --> G["Which did you like more?<br/>binary insertion, ≤ ⌈log₂(n+1)⌉ questions<br/>'Too close' = directly below pivot"]
  G --> H["Placed: #k of n<br/>score from bucket band<br/>rankAtTime snapshotted"]
  H --> I["Share card<br/>A Cover · B Stats · C Editorial<br/>PNG export (web)"]
  H --> J["Profile updates<br/>latest finish, year, top of list, months"]
  J -- "Re-rank" --> E
```

## 4. Who sees what (privacy dial)

```mermaid
flowchart LR
  p0["private<br/>profile shell only"] --> p1["completions<br/>+ finished books, ranks"] --> p2["reports<br/>+ reports tab"] --> p3["open<br/>+ reading activity, pages"]
```

The owner always sees everything. Planned: a Cloud Function writes the public
projection `profiles/{uid}` according to this dial, since rules can't hide fields.

## 5. Firebase data path

```mermaid
flowchart LR
  screen["Screen"] --> store["store / session"] --> backend["Backend<br/>(packages/firebase)"]
  backend --> rules{"firestore.rules<br/>owner + email_verified<br/>valid profile, fixed handle"}
  rules --> users["users/{uid}"]
  rules --> handles["handles/{handle}"]
  users -. "next slice" .-> lib["library · rankings · completions"]
```

Today only the profile lives in Firestore. Books, rankings and completions are still
in memory in every mode.
