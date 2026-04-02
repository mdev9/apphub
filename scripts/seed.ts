import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local" });

const USE_LOCAL = !process.env.R2_ENDPOINT;
const LOCAL_DIR = path.resolve(process.cwd(), "data");

const s3 = USE_LOCAL
  ? (null as unknown as S3Client)
  : new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

const BUCKET = process.env.R2_BUCKET_NAME || "apphub-content";

async function put(key: string, body: string, contentType = "text/markdown") {
  if (USE_LOCAL) {
    const fp = path.join(LOCAL_DIR, key);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, body, "utf-8");
  } else {
    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
    );
  }
  console.log(`  ✓ ${key}`);
}

async function seed() {
  console.log(`Seeding ${USE_LOCAL ? "local ./data/" : "R2 bucket"}...\n`);

  // Wiki index
  await put("wiki/index.md", `---
title: "Mobile App Growth Knowledge Base"
description: "Data-driven strategies for building, growing, and monetizing mobile apps"
---

# Mobile App Growth Knowledge Base

Welcome to AppHub — a curated, AI-analyzed collection of proven strategies for mobile app success.

## Categories

- **Acquisition** — Getting users to discover and install your app
- **Monetization** — Turning users into revenue
- **Retention** — Keeping users engaged and reducing churn
- **Analytics** — Measuring what matters
- **Optimization** — ASO, performance, and conversion optimization
`);

  // Category meta files
  await put("wiki/acquisition/_meta.json", JSON.stringify({ title: "User Acquisition", order: 1 }), "application/json");
  await put("wiki/monetization/_meta.json", JSON.stringify({ title: "Monetization", order: 2 }), "application/json");
  await put("wiki/retention/_meta.json", JSON.stringify({ title: "Retention", order: 3 }), "application/json");
  await put("wiki/analytics/_meta.json", JSON.stringify({ title: "Analytics", order: 4 }), "application/json");
  await put("wiki/optimization/_meta.json", JSON.stringify({ title: "Optimization", order: 5 }), "application/json");

  // Sample wiki pages
  await put("wiki/acquisition/organic-growth.md", `---
title: "Organic Growth Strategies"
description: "Proven approaches to acquiring users without paid advertising"
tags: ["acquisition", "organic", "ASO", "virality"]
author: "ai"
createdAt: "2026-04-01T12:00:00Z"
updatedAt: "2026-04-01T12:00:00Z"
---

# Organic Growth Strategies

Organic growth remains the most sustainable and cost-effective way to build a mobile app user base. Unlike paid acquisition, organic channels compound over time and typically deliver higher-quality users with better retention.

## App Store Optimization (ASO)

ASO is the foundation of organic mobile growth. The key levers:

### Title and Subtitle
- Include your primary keyword in the app title
- Keep it readable — don't keyword-stuff
- Apple allows 30 characters for title, 30 for subtitle
- Google Play allows 30 characters for title

### Keywords (iOS)
- You get 100 characters in the keyword field
- Use commas to separate, no spaces after commas
- Don't repeat words already in your title
- Target long-tail keywords with lower competition first

### Screenshots and Preview Videos
- First 2-3 screenshots are critical — most users don't scroll
- Show the core value proposition immediately
- Use captions to explain what users see
- A/B test screenshot order and messaging

## Word of Mouth and Virality

The best organic growth comes from building something people naturally want to share.

### Viral Loops
- **Inherent virality**: The product is better with more people (messaging apps, social networks)
- **Incentivized virality**: Users get value from inviting others (referral programs, shared rewards)
- **Content virality**: Users create content that lives outside the app (Spotify Wrapped, fitness achievements)

### Key Metric: Viral Coefficient (K-factor)
\`\`\`
K = invitations_per_user × conversion_rate
\`\`\`
- K > 1: Exponential growth (very rare)
- K = 0.5-1.0: Strong viral component, growth with other channels
- K < 0.5: Virality alone won't drive meaningful growth

## Content Marketing

- Create valuable content that ranks for problems your app solves
- Target "how to" and problem-aware search queries
- Link to app store listings with proper attribution parameters
- Build authority in your niche over time

> [!NOTE]
> Organic growth is slow to start but compounds. Most successful apps combine organic strategies with targeted paid acquisition to accelerate initial growth, then shift budget as organic channels mature.
`);

  await put("wiki/monetization/subscription-models.md", `---
title: "Subscription Models"
description: "Designing and optimizing subscription-based monetization for mobile apps"
tags: ["monetization", "subscriptions", "pricing", "revenue"]
author: "ai"
createdAt: "2026-04-01T12:00:00Z"
updatedAt: "2026-04-01T12:00:00Z"
---

# Subscription Models

Subscriptions are the dominant monetization model for non-game mobile apps. They provide predictable recurring revenue but require careful design to maximize conversion and minimize churn.

## Subscription Tiers

### The Standard Approach: Good / Better / Best
Most successful apps offer 2-3 tiers:

1. **Free tier** — Core functionality, enough to demonstrate value
2. **Standard** — Unlocks primary premium features
3. **Premium** — Everything + advanced/power-user features

### Pricing Psychology
- **Anchor high**: Show the most expensive option first
- **Highlight the middle**: Most users choose the middle option (compromise effect)
- **Annual discount**: Offer 15-40% savings for annual vs monthly
- Annual plans dramatically reduce churn (user is committed for 12 months)

## Key Metrics

| Metric | Good | Great | Elite |
|--------|------|-------|-------|
| Free-to-paid conversion | 2-5% | 5-10% | 10%+ |
| Monthly churn (B2C) | 6-8% | 4-6% | <4% |
| Annual churn (B2C) | 30-50% | 20-30% | <20% |
| Trial-to-paid conversion | 40-50% | 50-65% | 65%+ |

## Trial Strategy

Free trials are the most effective conversion mechanism for subscriptions:

- **7-day trials** work well for apps with immediate value (fitness, productivity)
- **14-day trials** better for apps that need time to demonstrate value (habit trackers, learning apps)
- **No trial + freemium** when the free tier itself is the trial

> [!WARNING]
> Avoid "reverse trials" (giving full access then taking it away) unless your app creates strong lock-in during the trial period. Users who feel cheated by feature removal rarely convert — they leave.

## Paywall Design

The paywall is your most important conversion screen:

- Show the paywall after the user has experienced value (not before)
- Hard paywalls (must subscribe to continue) convert higher but may hurt retention
- Soft paywalls (can dismiss) convert lower but build more trust
- Always show what the user gets, not just what they pay
`);

  await put("wiki/retention/churn-prevention.md", `---
title: "Churn Prevention"
description: "Evidence-based strategies to reduce user churn in mobile apps"
tags: ["retention", "churn", "engagement", "lifecycle"]
author: "ai"
createdAt: "2026-04-01T12:00:00Z"
updatedAt: "2026-04-01T12:00:00Z"
---

# Churn Prevention

Churn is the silent killer of mobile apps. Reducing churn by even a few percentage points can dramatically increase lifetime value and compound growth.

## Understanding Churn

### Types of Churn
- **Voluntary churn**: User actively cancels or uninstalls
- **Involuntary churn**: Payment failure, expired card (15-40% of all churn!)
- **Silent churn**: User stops engaging but doesn't cancel

### When Users Churn
Most churn happens in predictable windows:
- **Day 1**: 20-30% of users never return after install
- **Day 7**: 50-70% of users have churned
- **Day 30**: 80-90% of users have churned
- **After trial ends**: Major spike if value wasn't demonstrated

## Prevention Strategies

### 1. Onboarding Optimization
The first session determines everything:
- Get users to the "aha moment" as fast as possible
- Remove friction — minimize required steps before value
- Use progressive disclosure — don't overwhelm with features
- Personalize the experience based on user goals

### 2. Engagement Loops
Build habit-forming loops:
\`\`\`
Trigger → Action → Reward → Investment
\`\`\`
- **Trigger**: Push notification, email, in-app prompt
- **Action**: User opens app and does something
- **Reward**: Value delivered (content, progress, social validation)
- **Investment**: User adds data/content that makes leaving costly

### 3. Win-Back Campaigns
For users showing churn signals:
- Identify churn predictors (decreasing session frequency, feature abandonment)
- Trigger targeted interventions (personalized push, email, in-app message)
- Offer incentives for at-risk users (discount, extended trial, feature unlock)

### 4. Involuntary Churn Recovery
- Implement dunning management (retry failed payments with smart timing)
- Send payment failure notifications before cancellation
- Offer alternative payment methods
- Use grace periods — don't immediately revoke access

## Measuring Churn

Track cohort-based retention curves, not just aggregate churn rate:

- **D1, D7, D30 retention**: Basic health metrics
- **Week-over-week retention**: Ongoing engagement trend
- **Revenue retention (NRR)**: For subscriptions, accounts for upgrades/downgrades
- **Resurrection rate**: Users who churned then came back (hidden growth lever)
`);

  await put("wiki/analytics/key-metrics.md", `---
title: "Key Metrics for Mobile Apps"
description: "The essential metrics every mobile app should track from day one"
tags: ["analytics", "metrics", "KPIs", "data"]
author: "ai"
createdAt: "2026-04-01T12:00:00Z"
updatedAt: "2026-04-01T12:00:00Z"
---

# Key Metrics for Mobile Apps

Not all metrics matter equally. Focus on the metrics that actually drive decisions, not vanity metrics that look good in reports.

## The Metrics That Matter

### 1. Retention Rate (by cohort)
**The single most important metric.** If users don't come back, nothing else matters.
- D1 retention: Did they find initial value?
- D7 retention: Is there a habit forming?
- D30 retention: Are they truly engaged?

### 2. Lifetime Value (LTV)
How much revenue a user generates over their entire relationship with your app.
\`\`\`
LTV = ARPU × Average Lifetime
LTV = ARPU / Churn Rate (simplified for subscriptions)
\`\`\`

### 3. Customer Acquisition Cost (CAC)
Total cost to acquire one user (or one paying user).
\`\`\`
CAC = Total Marketing Spend / New Users Acquired
\`\`\`

**The golden ratio: LTV:CAC should be > 3:1** for a sustainable business.

### 4. Daily/Monthly Active Users (DAU/MAU)
- DAU/MAU ratio (stickiness): How often monthly users come back daily
  - Social apps: 50%+ is strong
  - Utility apps: 20-30% is normal
  - Content apps: 15-25% is typical

### 5. Revenue Metrics
- **MRR**: Monthly Recurring Revenue
- **ARPU**: Average Revenue Per User
- **ARPPU**: Average Revenue Per Paying User
- **Conversion rate**: Free → Paid

## Metrics to Ignore (or Deprioritize)

- **Total downloads**: Vanity metric. Users who download and never open add zero value.
- **Total registered users**: Same problem. Focus on active users.
- **Session duration** (alone): Longer isn't always better. A banking app with long sessions probably has UX problems.
- **Star rating** (as primary metric): Important for ASO but not a business driver.

## Building a Metrics Dashboard

Start with these 5 on your primary dashboard:
1. D1/D7/D30 retention curves
2. DAU and WAU trends
3. Revenue (MRR + trend)
4. LTV:CAC ratio
5. Funnel conversion rates (install → signup → activation → purchase)
`);

  await put("wiki/optimization/app-store-optimization.md", `---
title: "App Store Optimization (ASO)"
description: "A systematic approach to improving app store visibility and conversion"
tags: ["optimization", "ASO", "app store", "conversion"]
author: "ai"
createdAt: "2026-04-01T12:00:00Z"
updatedAt: "2026-04-01T12:00:00Z"
---

# App Store Optimization (ASO)

ASO is the process of improving your app's visibility and conversion rate in app stores. It's the mobile equivalent of SEO and should be a continuous process, not a one-time setup.

## The Two Pillars of ASO

### 1. Visibility (Search Rankings)
Getting your app to appear when users search relevant terms.

**Ranking factors:**
- Keyword relevance (title, subtitle, keyword field, description)
- Download velocity (recent downloads, not total)
- Ratings and review velocity
- Engagement signals (retention, session frequency)
- Update frequency

### 2. Conversion (Page Optimization)
Convincing users to install once they find your listing.

**Conversion factors:**
- App icon (first thing users see in search results)
- Screenshots (first 2-3 visible without scrolling)
- Preview video (autoplays on iOS)
- Title and subtitle
- Ratings and reviews
- App size

## ASO Process

### Step 1: Keyword Research
- Use ASO tools (AppTweak, Sensor Tower, data.ai) to find keyword volumes
- Target keywords where you can realistically rank (not just high-volume ones)
- Map keywords to user intent

### Step 2: Metadata Optimization
- Place highest-value keywords in title and subtitle
- Use the iOS keyword field strategically (100 characters)
- On Google Play, optimize the long description (it's indexed)

### Step 3: Creative Optimization
- A/B test everything via store experiments
- Test one variable at a time
- Run tests for at least 7 days with statistical significance

### Step 4: Monitor and Iterate
- Track keyword rankings weekly
- Monitor conversion rate changes
- React to competitor moves
- Update seasonally when relevant
`);

  // Empty meta files
  await put("meta/articles-index.json", JSON.stringify({}), "application/json");
  await put("meta/blocked-ips.json", JSON.stringify([]), "application/json");

  console.log("\n✅ Seed complete!");
}

seed().catch(console.error);
