/**
 * Backfill: Marc Lou "viral product" principles → atomic AppHub entries.
 *
 * Source: Marc Lou newsletter ("things about viral products"). Each principle is
 * already atomic, so it maps 1:1 to an entry. Generic indie-SaaS / landing-page
 * wisdom — complements the App Society subscription-mobile content. Where a
 * principle conflicts with subscription-app practice (free plans, subscriptions,
 * pricing), confidence is "debated" and the caveat names the tension.
 *
 * Run WITHOUT loading .env.local so storage falls back to local ./data:
 *   npx tsx scripts/backfill-marclou.ts
 */
import { putObject } from "../src/lib/r2";
import { addFrontmatter } from "../src/lib/markdown";
import { buildSearchIndex } from "../src/lib/search";

interface Entry {
  id: string;
  title: string;
  description: string;
  topics: string[];
  claim: string;
  numbers?: string[];
  confidence: "high" | "medium" | "debated";
  body: string;
}

const SOURCE = "Marc Lou newsletter";

const ENTRIES: Entry[] = [
  {
    id: "no-free-plan",
    title: "A viral product has no free plan",
    description: "Free users cost support and server time and skew your roadmap; under 3% ever convert.",
    topics: ["pricing", "monetization", "paywall"],
    claim: "Drop the free plan: under 3% of free users ever convert, while they raise support load, server cost, and pull the roadmap toward features paying users don't want.",
    numbers: ["<3% of free users ever convert"],
    confidence: "debated",
    body: "Free users increase support, server costs, and make you build features your paying customers don't want. Less than 3% of free users ever convert.\n\n**Apply when:** indie / one-time or self-serve SaaS where free tiers mostly attract non-buyers.\n**Caveat:** for subscription mobile apps, a free tier can feed top-of-funnel and aid conversion if the app earns enough usage — App Society treats freemium-vs-hard-paywall as a real trade-off, not a rule. See [[hard-paywall-is-validation]].",
  },
  {
    id: "three-colors",
    title: "A viral product has three colors",
    description: "Black text, white background, one accent color for the buy button.",
    topics: ["design", "landing-page"],
    claim: "Limit a landing page to three colors — black text, white background, one accent reserved for the Buy button — so attention lands where it matters.",
    confidence: "medium",
    body: "Every color fights for attention. The more colors you add, the less people notice what matters. Black text. White background. One color for the Buy button.",
  },
  {
    id: "numbers-not-adjectives",
    title: "Use numbers instead of adjectives",
    description: "'Save 4 hours every week' beats 'fast'.",
    topics: ["copywriting"],
    claim: "Replace vague adjectives with concrete numbers: 'Save 4 hours every week' is memorable where 'fast' is forgettable.",
    confidence: "medium",
    body: "\"Fast\" is forgettable. \"Save 4 hours every week\" isn't. Quantified benefits are picturable and sticky. See [[no-weak-words]].",
  },
  {
    id: "shareable-footer",
    title: "End with a footer people want to share",
    description: "97% won't buy, but they might share. Finish strong.",
    topics: ["landing-page", "marketing"],
    claim: "Design the footer as a shareable moment: 97% of visitors won't buy, but they might share, and people remember what they see last.",
    numbers: ["97% of visitors won't buy"],
    confidence: "medium",
    body: "97% of visitors won't buy, but they might share. People remember what they see last. Finish strong.",
  },
  {
    id: "og-image-as-thumbnail",
    title: "Treat the OG image as a YouTube thumbnail",
    description: "It's often seen more than your actual website.",
    topics: ["og-image", "marketing"],
    claim: "Design the Open Graph image like a YouTube thumbnail — if they don't click, they don't watch — because it's often seen more than the site itself.",
    confidence: "medium",
    body: "\"If they don't click, they don't watch.\" Your OG image is often seen more than your actual website. Design it like a YouTube thumbnail.",
  },
  {
    id: "one-idea-per-screen",
    title: "Reveal one idea per screen",
    description: "One screen, one message — like the Instagram feed.",
    topics: ["landing-page", "design", "onboarding"],
    claim: "Each screen should communicate exactly one idea and nothing else — one screen, one message.",
    confidence: "medium",
    body: "Don't try to say everything at once. One screen should communicate one idea and nothing else. One screen. One message. Just like the Instagram feed. This applies to onboarding too — see [[one-idea-per-screen]] used in flow design.",
  },
  {
    id: "fifth-grader-headline",
    title: "Write a headline a fifth grader can understand",
    description: "Complexity kills curiosity. Your mum should get it.",
    topics: ["copywriting"],
    claim: "Use simple words in the headline — complexity kills curiosity; if your mum doesn't get it, rewrite it.",
    confidence: "medium",
    body: "Complexity kills curiosity. Use simple words. Your mum should get it.",
  },
  {
    id: "hard-paywall-is-validation",
    title: "A hard paywall is your validation",
    description: "If nobody pulls out a card, you don't have validation. Ask for payment before data.",
    topics: ["paywall", "validation", "monetization"],
    claim: "Use a hard paywall: signups don't pay the bills — if nobody is willing to pull out a credit card you don't have validation. Ask for payment before asking for data.",
    confidence: "high",
    body: "Signups don't pay the bills. If nobody is willing to pull out their credit card, you don't have validation. Ask for payment before asking for data.\n\n**Note:** this aligns with App Society / RevenueCat data showing hard paywalls convert several times better than freemium. See [[no-free-plan]].",
  },
  {
    id: "copy-only-you-could-write",
    title: "Write copy only you could write",
    description: "If a competitor could copy-paste it, it's too generic.",
    topics: ["copywriting"],
    claim: "If a competitor could copy-paste your landing page onto their site, your copy is too generic — write from experience.",
    confidence: "medium",
    body: "If a competitor could copy-paste your landing page onto their website, your copy is too generic. Write from experience.",
  },
  {
    id: "show-before-explain",
    title: "Show the product before explaining it",
    description: "A demo communicates more than paragraphs. Show, don't tell.",
    topics: ["landing-page"],
    claim: "Lead with a demo: showing the product communicates more than paragraphs of text.",
    confidence: "medium",
    body: "A demo communicates more than paragraphs of text. Show. Don't tell. Pairs with [[try-before-you-buy]].",
  },
  {
    id: "do-one-thing",
    title: "A viral product does one thing",
    description: "People remember the tool that solved their problem, not the Swiss Army knife.",
    topics: ["product-strategy", "positioning"],
    claim: "Do one thing well — the more you do, the less people remember; nobody remembers Swiss Army knives.",
    confidence: "medium",
    body: "The more things you do, the less people remember. People don't remember Swiss Army knives. They remember the tool that solved their problem. Be known for one thing.",
  },
  {
    id: "popcorn-pricing",
    title: "Use Popcorn Pricing (three tiers)",
    description: "Good, Better, Best. Every extra tier is another reason to leave.",
    topics: ["pricing"],
    claim: "Keep pricing to three choices — Good, Better, Best — because every extra tier creates another decision and another reason to leave.",
    numbers: ["3 tiers max"],
    confidence: "medium",
    body: "Your visitors came to buy a product, not study a spreadsheet. Every pricing tier you add creates another decision and another reason to leave. Keep it to three choices: Good. Better. Best.",
  },
  {
    id: "ride-a-wave",
    title: "A viral product rides a wave",
    description: "Build around trends people already discuss — the wave does half the marketing.",
    topics: ["marketing", "product-strategy"],
    claim: "Build around trends, technologies, and problems people are already discussing — the wave does half the marketing for you.",
    confidence: "medium",
    body: "Build around trends, technologies, and problems people are already discussing. The wave does half the marketing for you.",
  },
  {
    id: "steal-copy-from-customers",
    title: "Steal your best copy from customers",
    description: "Customers describe your product better than you do. Write like they talk.",
    topics: ["copywriting"],
    claim: "Pull your best copy from how customers describe the product — they already say it better than you do.",
    confidence: "medium",
    body: "Customers already describe your product better than you do. Write like your customers talk. Mine reviews, support tickets, and interviews for exact phrasing. See [[steal-copy-from-customers]] alongside [[empathy-before-selling]].",
  },
  {
    id: "visible-founder",
    title: "Have a founder people can see and hear",
    description: "A founder screen recording beats a corporate promo video.",
    topics: ["marketing"],
    claim: "Put a visible founder forward — people buy from people, and a founder's screen recording beats a corporate promo or a wall of features.",
    confidence: "medium",
    body: "People buy from people. A screen recording from the founder beats a corporate promo video or a wall of features. Show your face. (App Society's UGC / creator tactics are the paid-acquisition version of this.)",
  },
  {
    id: "pricing-in-header",
    title: "Make pricing impossible to miss",
    description: "Put 'Pricing' in the header — visitors use it to understand the product.",
    topics: ["pricing", "landing-page"],
    claim: "Put 'Pricing' in the header — it's one of the first places visitors look, and they use it to understand the product, not just the price.",
    confidence: "medium",
    body: "The pricing section is one of the first places visitors look. They use it to understand the product, not just the price. Put \"Pricing\" in the header.",
  },
  {
    id: "memorable-headline",
    title: "Write a headline people remember the next day",
    description: "Write five, wait 24h, keep the one that sticks.",
    topics: ["copywriting"],
    claim: "Test headlines for 24-hour recall: write five, show friends, wait a day, and keep the one they still remember.",
    numbers: ["5 headlines tested for 24h recall"],
    confidence: "medium",
    body: "Write five headlines. Show them to friends. Wait 24 hours and ask which one they remember. Keep the one that sticks.",
  },
  {
    id: "emotional-headline",
    title: "Write an emotional headline",
    description: "People remember feelings, not features. Make them laugh, say wow, or WTF.",
    topics: ["copywriting"],
    claim: "Make the headline emotional — people remember feelings, not features; aim to make them laugh, say wow, or 'what is this?'.",
    confidence: "medium",
    body: "People don't remember features. They remember feelings. Your headline should make people laugh, say wow, or think \"what the f*** is this?\". Write for humans.",
  },
  {
    id: "show-something-new",
    title: "Do something people have never seen before",
    description: "Nobody shares another clone. Surprise people.",
    topics: ["product-strategy", "marketing"],
    claim: "Show people something they have never seen — nobody shares another clone, so surprise is what earns shares.",
    confidence: "medium",
    body: "Nobody shares another clone. Surprise people. (Note the tension with App Society's 'copy proven models first' — copy the business model, but find one surprising, screen-recordable moment.)",
  },
  {
    id: "sell-from-hero",
    title: "Sell from the hero section alone",
    description: "80% won't scroll past the hero. Fix the hero first.",
    topics: ["hero", "landing-page"],
    claim: "The hero must sell on its own: ~80% of visitors won't scroll past it, so if they don't get it and want it within seconds, you've lost them.",
    numbers: ["80% of visitors don't scroll past the hero"],
    confidence: "medium",
    body: "80% of visitors won't scroll past the hero. If they don't understand the product and want it within a few seconds, you've already lost. Fix the hero first. The mobile-app analogue: the first onboarding screen — see [[one-idea-per-screen]].",
  },
  {
    id: "empathy-before-selling",
    title: "Show empathy before you sell",
    description: "Describe the problem better than they can, then they trust your solution.",
    topics: ["copywriting", "positioning"],
    claim: "Earn trust by describing the user's problem better than they can before pitching the solution.",
    confidence: "medium",
    body: "Before people trust your solution, they need to believe you understand their problem. Describe the problem better than they can.",
  },
  {
    id: "one-cta",
    title: "Have one call to action",
    description: "Multiple paths make many people choose none.",
    topics: ["cta", "landing-page"],
    claim: "Offer exactly one call to action — every extra button creates hesitation, and multiple paths make many people choose none.",
    confidence: "medium",
    body: "Every extra button creates hesitation. When people have multiple paths, many choose none. Give people one next step. Just one. See [[cta-says-what-happens-next]].",
  },
  {
    id: "memorable-name",
    title: "Use a name people remember",
    description: "Known words, no wordplay or made-up names that need explaining.",
    topics: ["naming", "branding"],
    claim: "Use a name built from words people already know — avoid wordplay, invented words, and names that require explanation.",
    confidence: "medium",
    body: "Use words people already know. Avoid wordplay, made-up words, and names that require explanation.",
  },
  {
    id: "sell-human-desire",
    title: "Sell a human desire, not a feature",
    description: "More money, time, health, status, or less pain. Features are vehicles.",
    topics: ["copywriting", "positioning"],
    claim: "Sell the outcome — more money, time, health, status, or less pain — because features are just vehicles to get there.",
    confidence: "high",
    body: "People buy more money, more time, better health, more status, or less pain. Features are just vehicles to get there. Sell the outcome, not the feature. (App Society says the same about apps: target a core human desire, e.g. 'Am I attractive?' converts better than 'Am I productive?'.)",
  },
  {
    id: "try-before-you-buy",
    title: "Let people try before they buy",
    description: "Put your best features on the landing page. Let people play before they pay.",
    topics: ["landing-page", "product-strategy"],
    claim: "Expose your best features on the landing page rather than hiding them behind the paywall — let people play before they pay.",
    confidence: "medium",
    body: "Don't hide your best features behind a paywall. Put them on the landing page. Let people play before they pay.\n\n**Caveat:** this is in tension with the hard-paywall stance for subscription apps — see [[hard-paywall-is-validation]]. Reconcile by giving a visible taste of value, then gating depth.",
  },
  {
    id: "no-weak-words",
    title: "Cut weak words from your copy",
    description: "'Most', 'many', 'rarely' weaken the message. Make statements, not estimates.",
    topics: ["copywriting"],
    claim: "Remove hedge words like 'most', 'many', 'rarely' — strong copy makes clear claims people can picture, remember, and challenge.",
    confidence: "medium",
    body: "\"Most\", \"many\", \"rarely\" weaken your message because nobody knows what they mean. Strong copy makes clear claims that people can picture, remember, and challenge. Make statements, not estimates. Pairs with [[numbers-not-adjectives]].",
  },
  {
    id: "one-time-over-subscription",
    title: "Consider one-time payments over subscriptions",
    description: "One-time payments are 10x easier to sell — people already pay for enough subscriptions.",
    topics: ["pricing", "monetization"],
    claim: "Prefer one-time payments over subscriptions where possible — they're far easier to sell because people are saturated with monthly charges.",
    numbers: ["one-time payments described as 10x easier to sell"],
    confidence: "debated",
    body: "People already pay for enough subscriptions. Don't add another monthly charge unless you can't ship without it. One-time payments are 10x easier to sell.\n\n**Caveat:** directly opposes the subscription-app playbook (App Society, RevenueCat) where recurring revenue and LTV are the whole model. Context decides: one-time fits indie utilities; subscriptions fit ongoing-value consumer apps.",
  },
  {
    id: "cta-says-what-happens-next",
    title: "A CTA should say what happens next",
    description: "'Analyze My Website' beats 'Get Started'. Remove uncertainty.",
    topics: ["cta", "copywriting"],
    claim: "Make the CTA describe the next action ('Analyze My Website'), not a generic 'Get Started', to remove uncertainty.",
    confidence: "medium",
    body: "\"Get Started\" means nothing. \"Analyze My Website\" tells people exactly what they're about to do. Remove uncertainty. See [[one-cta]].",
  },
  {
    id: "testimonials-before-traffic",
    title: "Don't launch without testimonials",
    description: "A page without proof asks strangers to trust you blindly. Collect proof before traffic.",
    topics: ["social-proof", "validation"],
    claim: "Collect testimonials from early users/friends/beta testers before sending traffic — a page without proof asks strangers to trust you blindly.",
    confidence: "medium",
    body: "A landing page without testimonials is asking strangers to trust you blindly. Get a few users, friends, or beta testers first and collect their feedback. Collect proof before traffic.",
  },
  {
    id: "describe-in-ten-words",
    title: "Describe the product in under 10 words",
    description: "If you can't, your users won't either.",
    topics: ["positioning", "copywriting"],
    claim: "If you can't explain the product in one sentence under 10 words, your users won't be able to either.",
    numbers: ["under 10 words"],
    confidence: "medium",
    body: "If you can't explain your product in one sentence, your users won't either. See [[fifth-grader-headline]].",
  },
  {
    id: "price-higher-than-competitors",
    title: "Be more expensive than competitors",
    description: "Nobody talks about the second cheapest option. Charge more.",
    topics: ["pricing"],
    claim: "Price above competitors — nobody talks about the second cheapest option, and the entrepreneur is usually the only thing stopping a price increase.",
    confidence: "debated",
    body: "Nobody talks about the second cheapest option. Charge more.\n\n**Note:** echoes App Society's finding that raising prices often raised both trials and conversions (perceived value). Caveat: depends on positioning and proof — premium pricing without testimonials/credibility backfires.",
  },
];

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const topicsSeen = new Set<string>();

  for (const e of ENTRIES) {
    const primary = e.topics[0];
    topicsSeen.add(primary);
    const fm: Record<string, unknown> = {
      title: e.title,
      description: e.description,
      type: "lesson",
      topics: e.topics,
      claim: e.claim,
      confidence: e.confidence,
      source: SOURCE,
      author: "curated",
    };
    if (e.numbers && e.numbers.length) fm.numbers = e.numbers;
    const md = addFrontmatter(e.body, fm);
    const key = `wiki/${primary}/${e.id}.md`;
    await putObject(key, md);
    console.log(`  + ${key}`);
  }

  // Ensure each primary topic has a _meta.json so nav/labels render.
  let order = 10;
  for (const topic of topicsSeen) {
    const metaKey = `wiki/${topic}/_meta.json`;
    await putObject(metaKey, JSON.stringify({ title: titleCase(topic), order: order++ }), "application/json");
  }

  const docs = await buildSearchIndex();
  console.log(`\n✓ wrote ${ENTRIES.length} Marc Lou entries across ${topicsSeen.size} topics; index now ${docs.length} docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
