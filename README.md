# Factory OS v1 - Outreach & Lead Qualification Agent

> Turn any lead list into revenue — automatically.

Factory OS finds decision-makers, researches their companies, writes personalized outreach, and qualifies every lead. All in 30 seconds.

## Features

- **Autonomous Research**: Crawls websites, extracts positioning, identifies ICP fit
- **Personalized Outreach**: Generates tailored emails, LinkedIn DMs, and call scripts
- **Lead Qualification**: A/B/C scoring, predicted objections, recommended next steps
- **Multi-Channel**: Email, LinkedIn, phone — all covered
- **CRM Integration**: Push to HubSpot, Pipedrive, Gmail, Outlook
- **Real-Time Processing**: Watch agents work in real-time

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your keys

# Run database migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

Visit http://localhost:3000

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL + pgvector (Supabase)
- **Queue**: BullMQ + Redis
- **AI**: Anthropic Claude, OpenAI
- **Auth**: NextAuth.js (magic links)
- **Payments**: Stripe

## Project Structure

```
factory-os/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Main app pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Core libraries
│   ├── agents/           # AI agents
│   ├── db/               # Database & schema
│   ├── queue/            # Background jobs
│   └── utils/            # Utilities
├── types/                 # TypeScript types
└── public/               # Static assets
```

## Development Roadmap

### Week 1 - Core Agent + Backend
- [x] Foundation setup
- [ ] Lead ingestion layer
- [ ] Research agent
- [ ] Outreach agent
- [ ] Qualification agent
- [ ] UI v1

### Week 2 - Polishing + Launch
- [ ] Auto-sequence module
- [ ] Email/CRM integrations
- [ ] Billing + paywalls
- [ ] Landing page
- [ ] Beta testing
- [ ] Ship

## Pricing

- **Free**: 20 leads/month, export only
- **Pro**: $39/mo, 500 leads, auto-send, integrations
- **Growth**: $99/mo, 2,500 leads, multi-channel
- **Scale**: $299/mo, unlimited, team features

## License

Proprietary - All rights reserved
