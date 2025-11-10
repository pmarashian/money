# Financial Dashboard

A modern, AI-powered personal finance dashboard that connects to your bank accounts to provide intelligent insights into your spending patterns and financial outlook. Built with Next.js, TypeScript, and integrated with Plaid for secure banking data access.

![Financial Dashboard](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Financial+Dashboard)

## 🎭 About This Project

**This was "vibe coded"** - built during late nights and coffee-fueled coding sessions to solve personal financial anxiety about tracking automated payments and bonus distributions.

### 🎯 Flexibility

While originally built for a very specific financial situation (bi-weekly paychecks, quarterly bonuses, automated bill payments), the app has been made flexible enough to work for various income patterns:

- **With bonuses**: Set quarterly/annual bonus dates for accurate financial projections
- **Without bonuses**: Skip bonuses entirely and get 90-day projections based on regular income
- **Customizable**: Configure paycheck amounts, bonus ranges, and other financial parameters via environment variables

The app works as a more generic financial dashboard but excels at solving the specific problem of "will my automated payments account balance last until my next bonus?"

If your financial situation involves regular income and recurring expenses, this app can likely be adapted to work for you!

---

## ✨ Features

- **🔐 Secure Bank Integration** - Connect your bank account via Plaid
- **🤖 AI-Powered Analysis** - OpenAI-powered transaction categorization and automated payment detection
- **📊 Financial Insights** - Real-time balance tracking and spending analytics
- **🔔 Smart Alerts** - Automated notifications for low funds, upcoming bonuses, and unusual transactions
- **🔍 Advanced Search** - Full-text search through transactions with filtering
- **📱 PWA Support** - Installable progressive web app with offline capabilities
- **🎯 Financial Outlook** - Calculate how long your funds will last until the next bonus
- **📈 Spending Analytics** - Visualize spending patterns by category
- **⚡ Real-time Updates** - Webhook integration for instant transaction updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Redis (with RedisJSON and RedisSearch)
- **Banking**: Plaid API
- **AI**: OpenAI GPT-4
- **Authentication**: Session-based with JWT
- **Deployment**: Vercel (with Upstash Redis for Edge)

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ and npm
- Redis database (local or cloud)
- Plaid developer account
- OpenAI API account
- Upstash Redis account (for Vercel Edge)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd financial-dashboard
npm install
```

### 2. Environment Setup

Copy the environment example and configure your variables:

```bash
cp .env.example .env.local
```

Fill in the required environment variables:

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

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Setup Instructions

### Plaid Setup

1. Visit [Plaid Dashboard](https://dashboard.plaid.com/)
2. Create a developer account
3. Create a new application
4. Get your `client_id` and `secret`
5. Configure webhook URLs in Plaid dashboard

### OpenAI Setup

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add funds to your account (analysis costs ~$0.01-0.05 per request)

### Redis Setup

- **Local Development**: Install Redis locally or use Docker
- **Production**: Use Redis Cloud, Upstash, or AWS ElastiCache

### Upstash Redis (Required for Vercel)

1. Visit [Upstash Console](https://console.upstash.com/)
2. Create a Redis database
3. Copy REST URL and token for Edge middleware

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Plaid Integration

- `POST /api/plaid/connect` - Create link token
- `POST /api/plaid/connect/exchange` - Exchange public token
- `GET /api/plaid/transactions` - Get transactions
- `POST /api/plaid/webhook` - Handle transaction webhooks

### AI Analysis

- `POST /api/ai/analyze-transactions` - Analyze transactions with AI
- `GET /api/ai/analyze-transactions` - Get cached analysis

### Transaction Management

- `GET /api/transactions/search` - Search transactions
- `PUT /api/transactions/[id]/categorize` - Update transaction category

### Dashboard & Calculations

- `GET /api/dashboard` - Get dashboard data
- `GET /api/calculations` - Financial calculations
- `GET /api/alerts` - Get user alerts

### Setup Flow

- `GET /api/setup/status` - Check setup completion
- `POST /api/setup/initialize` - Initialize with bonus date
- `POST /api/setup/complete` - Complete setup

## 🎨 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── setup/             # Setup wizard
│   └── transactions/      # Transaction management
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── ai/               # OpenAI integration
│   ├── alerts/           # Alert system
│   ├── auth/             # Authentication utilities
│   ├── calculations/     # Financial calculations
│   ├── plaid/            # Plaid integration
│   ├── redis/            # Redis utilities
│   └── transactions/     # Transaction processing
└── utils/                 # Helper functions
```

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Environment Variables for Production

Ensure these are set in your deployment platform:

```bash
PLAID_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Setup

For production, use:

- **Redis**: Upstash, Redis Cloud, or AWS ElastiCache
- **Upstash Redis**: Required for Edge middleware on Vercel

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Ah, Support - the section where we pretend we'll actually help you. In reality, you're probably on your own, but let's go through the motions anyway:

1. Check the [Issues](https://github.com/your-repo/issues) page - maybe someone else already complained about your exact problem
2. Create a new issue with detailed information - the more details you provide, the less likely we are to respond
3. Include error logs and environment details - because nothing says "I debugged this thoroughly" like dumping your entire error stack

If all else fails, try turning it off and on again. Or just give up and build your own financial dashboard - we've got plenty of company in the graveyard of abandoned side projects.

## 🔒 Security

- All sensitive data is encrypted at rest
- Bank data is accessed via secure Plaid APIs
- Session management with secure JWT tokens
- Environment variables are never logged

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies. (And a lot of coffee ☕)
