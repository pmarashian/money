# Financial Dashboard

_"Will my automated payments account balance last until my next bonus?"_ - A modern, AI-powered personal finance dashboard that finally answers the question keeping you up at night. Built with Next.js, TypeScript, and integrated with Plaid for secure banking data access (because who needs sleep when you have financial anxiety?).

## 🎭 About This Project

**This was "vibe coded"** - built during late nights and coffee-fueled coding sessions to solve _that_ gnawing financial anxiety about whether your automated payments will bounce before your next bonus hits. Because nothing says "responsible adulting" like staying up until 3 AM coding your own financial dashboard.

### 🎯 Flexibility

While originally built for a very specific financial situation (bi-weekly paychecks, quarterly bonuses, automated bill payments that somehow always seem to go up but never down), the app has been made flexible enough to work for various income patterns:

- **With bonuses**: Set quarterly/annual bonus dates for accurate financial projections (because who doesn't love that "bonus anticipation anxiety"?)
- **Without bonuses**: Skip bonuses entirely and get 90-day projections based on regular income (living the stable life, you lucky bastard)
- **Customizable**: Configure paycheck amounts, bonus ranges, and other financial parameters via environment variables (because hardcoding your salary feels so permanent)

The app works as a more generic financial dashboard but excels at solving the specific problem of _"will my automated payments account balance last until my next bonus?"_ (spoiler: it usually doesn't).

If your financial situation involves regular income and recurring expenses, this app can likely be adapted to work for you! If not, well... good luck out there in the financial wilderness.

---

## ✨ Features

Because who doesn't love a good feature list? Here's what this bad boy can do (beyond making you question every financial decision you've ever made):

- **🔐 Secure Bank Integration** - Connect your bank account via Plaid (because entering your banking info manually is so 2010)
- **🤖 AI-Powered Analysis** - OpenAI-powered transaction categorization and automated payment detection (finally, AI that cares about your Netflix subscription)
- **📊 Financial Insights** - Real-time balance tracking and spending analytics (spoiler: you're spending more than you think)
- **🔔 Smart Alerts** - Automated notifications for low funds, upcoming bonuses, and unusual transactions (because nothing says "fun" like getting pinged about money)
- **🔍 Advanced Search** - Full-text search through transactions with filtering (because who can remember what they bought last Tuesday?)
- **📱 PWA Support** - Installable progressive web app with offline capabilities (take your financial anxiety on the go!)
- **🎯 Financial Outlook** - Calculate how long your funds will last until the next bonus (the anxiety-inducing feature you didn't know you needed)
- **📈 Spending Analytics** - Visualize spending patterns by category (watch your "coffee" category grow in real-time)
- **⚡ Real-time Updates** - Webhook integration for instant transaction updates (because delayed gratification is for suckers)

## 🛠️ Tech Stack

Ah, the tech stack - where we pretend our choices were made after careful consideration rather than "what's trendy this week?"

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS (because vanilla JS is for masochists and custom CSS is for barbarians)
- **Backend**: Next.js API Routes (full-stack in one package? Don't mind if we do!)
- **Database**: Redis (with RedisJSON and RedisSearch) (who needs SQL when you can have key-value stores and JSON blobs?)
- **Banking**: Plaid API (because building your own bank integration from scratch sounds like a fun weekend project)
- **AI**: OpenAI GPT-4 (because nothing says "smart" like paying per API call to categorize your Starbucks purchases)
- **Authentication**: Session-based with JWT (because cookies are just JWTs that went to therapy)
- **Deployment**: Vercel (with Upstash Redis for Edge) (serverless means never having to say you're sorry for cold starts)

## 📋 Prerequisites

Before you can join the elite club of people who have this running locally, make sure you have all these accounts and dependencies. (Pro tip: Most developers get stuck at this step and just stare at their screen wondering why they started coding.)

- Node.js 18+ and npm (because Node 16 is so last year)
- Redis database (local or cloud) (who doesn't love managing another database?)
- Plaid developer account (because "sandbox" sounds so much more fun than "production")
- OpenAI API account (and don't forget to add credits, or you'll get that delightful "insufficient funds" error)
- Upstash Redis account (for Vercel Edge) (because one Redis wasn't enough)

## 🚀 Quick Start

Ah, the mythical "Quick Start" section. In reality, this will take you about 3 hours, 47 browser tabs, and at least one existential crisis. But let's pretend it's quick!

### 1. Clone and Install

```bash
git clone <repository-url>
cd financial-dashboard
npm install
```

_Step 1: Clone the repo and install dependencies. This part actually is quick. Enjoy it while it lasts._

### 2. Environment Setup

Copy the environment example and configure your variables (good luck remembering where you put all those API keys):

```bash
cp .env.example .env.local
```

Fill in the required environment variables (because hardcoding secrets is totally not a security risk):

```bash
# Plaid API credentials
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key

# Redis connections
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Session secret
SESSION_SECRET=your_secure_random_string

# Financial configuration (optional - defaults for new users)
# Each user can customize these in their account settings
# PAYCHECK_DEPOSIT_AMOUNT=
# BONUS_AMOUNT_MIN=
# BONUS_AMOUNT_MAX=
```

_Step 2: Set up environment variables. This is where the fun begins. Make sure to copy-paste carefully - one wrong character and you're debugging for hours!_

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

_Step 3: Finally start the server! If everything worked, congratulations - you're now part of the elite 0.1% who got this running on the first try. If not, welcome to Stack Overflow._

## 🔧 Setup Instructions

Welcome to the setup maze! Follow these steps carefully, or spend the next week debugging cryptic error messages. (Pro tip: Have a stiff drink ready.)

### Plaid Setup

Ah, Plaid - the service that makes banking APIs almost tolerable:

1. Visit [Plaid Dashboard](https://dashboard.plaid.com/) (prepare for their delightful UI)
2. Create a developer account (because apparently "sandbox" credentials aren't enough)
3. Create a new application (name it something creative like "My App")
4. Get your `client_id` and `secret` (guard these with your life - or at least don't commit them)
5. Configure webhook URLs in Plaid dashboard (because nothing says "secure" like webhooks)

### OpenAI Setup

Time to pay for the privilege of having AI categorize your transactions:

1. Visit [OpenAI Platform](https://platform.openai.com/) (hope you have a good password manager)
2. Create an API key (don't lose this, or you'll be buying coffee with Monopoly money)
3. Add funds to your account (analysis costs ~$0.01-0.05 per request - because financial insights shouldn't be free)

### Redis Setup

Because one database wasn't enough, let's add another one to the mix:

- **Local Development**: Install Redis locally or use Docker (because who doesn't love managing local services?)
- **Production**: Use Redis Cloud, Upstash, or AWS ElastiCache (because paying for databases is the new hobby)

### Upstash Redis (Required for Vercel)

Ah, the Vercel Edge runtime - where "serverless" means "someone else's server":

1. Visit [Upstash Console](https://console.upstash.com/) (yet another dashboard to bookmark)
2. Create a Redis database (global replication sounds fancy but just means more configuration)
3. Copy REST URL and token for Edge middleware (because environment variables weren't complicated enough)

## 📚 API Documentation

Behold, the API documentation - where we pretend these endpoints are self-explanatory and don't need examples. (Spoiler: they do.)

### Authentication Endpoints

The classics - because every app needs a way to know who you are (or at least pretend to):

- `POST /api/auth/register` - User registration (hope you like email verification)
- `POST /api/auth/login` - User login (passwords are so 2020, but we're stuck with them)
- `POST /api/auth/logout` - User logout (the easiest endpoint to implement)

### Plaid Integration

Because talking to banks shouldn't require a degree in computer science:

- `POST /api/plaid/connect` - Create link token (the magic that makes bank connections work)
- `POST /api/plaid/connect/exchange` - Exchange public token (because security through obscurity is a valid strategy)
- `GET /api/plaid/transactions` - Get transactions (finally, the data you've been waiting for)
- `POST /api/plaid/webhook` - Handle transaction webhooks (real-time updates that you'll definitely set up correctly on the first try)

### AI Analysis

Give your transactions to a large language model and hope for the best:

- `POST /api/ai/analyze-transactions` - Analyze transactions with AI (because manual categorization is for peasants)
- `GET /api/ai/analyze-transactions` - Get cached analysis (because calling OpenAI costs money, duh)

### Transaction Management

CRUD operations for your financial sins:

- `GET /api/transactions/search` - Search transactions (because scrolling through 500 transactions manually is totally fine)
- `PUT /api/transactions/[id]/categorize` - Update transaction category (for when the AI gets it wrong, which is always)

### Dashboard & Calculations

The business logic - where the real financial anxiety happens:

- `GET /api/dashboard` - Get dashboard data (numbers that will keep you up at night)
- `GET /api/calculations` - Financial calculations (math so you don't have to do it)
- `GET /api/alerts` - Get user alerts (notifications you probably won't read)

### Setup Flow

Because first-time setup should be a delightful experience:

- `GET /api/setup/status` - Check setup completion (is it done yet? No. Is it done yet? No.)
- `POST /api/setup/initialize` - Initialize with bonus date (the moment of truth)
- `POST /api/setup/complete` - Complete setup (congratulations, you survived the setup flow!)

## 🎨 Project Structure

Behold, the sacred folder structure - organized in a way that makes perfect sense to the person who created it and absolutely no one else:

```
src/
├── app/                    # Next.js App Router (because file-based routing is the future)
│   ├── api/               # API routes (the backend in your frontend)
│   ├── auth/              # Authentication pages (login/logout/signup, the boring stuff)
│   ├── dashboard/         # Main dashboard (where the magic financial anxiety happens)
│   ├── setup/             # Setup wizard (the onboarding flow nobody reads)
│   └── transactions/      # Transaction management (because money management needs its own folder)
├── components/            # React components (reusable pieces that somehow never get reused)
├── lib/                   # Utility libraries (the "business logic" that grows uncontrollably)
│   ├── ai/               # OpenAI integration (expensive API calls go here)
│   ├── alerts/           # Alert system (notifications you'll ignore)
│   ├── auth/             # Authentication utilities (JWT nonsense)
│   ├── calculations/     # Financial calculations (math that keeps you up at night)
│   ├── plaid/            # Plaid integration (banking API wizardry)
│   ├── redis/            # Redis utilities (caching that might actually work)
│   └── transactions/     # Transaction processing (data transformation galore)
└── utils/                 # Helper functions (the junk drawer of code)
```

## 🚀 Deployment

Ah, deployment - where "it works on my machine" becomes "it works in production" (fingers crossed):

### Vercel Deployment

Because who doesn't love deploying to the cloud with just three easy steps?

1. Connect your repository to Vercel (their GitHub integration is actually pretty good)
2. Add environment variables in Vercel dashboard (copy-paste from your .env.local, but don't forget any)
3. Deploy automatically on push (watch the build logs nervously refresh)

### Environment Variables for Production

Don't forget these, or your app will spectacularly fail in production:

```bash
PLAID_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

_Pro tip: Test these locally first, or enjoy debugging production issues at 3 AM._

### Database Setup

For production, please don't use your local Redis instance (we've all been tempted):

- **Redis**: Upstash, Redis Cloud, or AWS ElastiCache (pick your poison)
- **Upstash Redis**: Required for Edge middleware on Vercel (because Vercel's Edge runtime needs special treatment)

## 🤝 Contributing

Ah, the Contributing section - that sacred text that contributors scroll past faster than a credit card bill they don't want to see. But hey, if you're one of the rare mythical creatures who actually reads this...

1. Fork the repository (because apparently "git clone" is too mainstream)
2. Create a feature branch (`git checkout -b feature/amazing-feature`) - bonus points if you actually name it something descriptive
3. Commit your changes (`git commit -m 'Add amazing feature'`) - please don't write "fix stuff" or "update things"
4. Push to the branch (`git push origin feature/amazing-feature`) - the moment of truth
5. Open a Pull Request - and hope for mercy from the maintainer gods

### Development Guidelines

Look at you, reading the development guidelines! You're clearly not like those other contributors who just dive in and break everything. Here's what we'd love you to do (but let's be real, we know you won't):

- Use TypeScript for all new code (because who doesn't love type safety?)
- Follow existing code style and conventions (we have them for a reason, even if they're inconsistent)
- Add tests for new features (ha! as if anyone actually does this)
- Update documentation as needed (documentation? What documentation?)
- Ensure all environment variables are documented (because we love deciphering cryptic error messages)

Pro tip: If you're feeling rebellious, just ignore all of this and submit your PR anyway. We've all been there.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Because who doesn't love reading legal documents before using open source software?)

**You're on your own now, friend.** Do whatever you want with this code - fork it, modify it, sell it to the highest bidder, or use it to power your evil robot army. But don't call me when things go wrong. Contact me? Wait, that doesn't make sense. Actually, do contact me if you need help, but let's be real - you're probably better off googling it. MIT means "Make It Terrible" in developer speak, so have fun breaking things!

## 🆘 Support

Ah, Support - the section where we pretend we'll actually help you. In reality, you're probably on your own, but let's go through the motions anyway:

1. Check the [Issues](https://github.com/your-repo/issues) page - maybe someone else already complained about your exact problem
2. Create a new issue with detailed information - the more details you provide, the less likely we are to respond
3. Include error logs and environment details - because nothing says "I debugged this thoroughly" like dumping your entire error stack

If all else fails, try turning it off and on again. Or just give up and build your own financial dashboard - we've got plenty of company in the graveyard of abandoned side projects.

## 🔒 Security

Don't worry, we've got your data security covered (or at least we hope we do):

- All sensitive data is encrypted at rest (because plain text is so last century)
- Bank data is accessed via secure Plaid APIs (they handle the banking security, we handle the UI)
- Session management with secure JWT tokens (because cookies were getting too mainstream)
- Environment variables are never logged (because who needs API keys in their error logs?)

_Disclaimer: No security system is foolproof, especially when you're dealing with money. Use at your own risk, and maybe don't store your life savings password here._

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies. (And a lot of coffee ☕ - because financial anxiety doesn't sleep, why should you?)

_If this README made you smile, consider it payment for the hours you'll spend setting this up. If it didn't... well, at least the coffee was good._
