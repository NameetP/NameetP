# Factory OS - Setup Guide

Complete guide to get Factory OS v1 running locally and deploying to production.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Supabase)
- Anthropic API key (Claude)
- Git

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Database - Use Supabase or local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/factory_os
DIRECT_URL=postgresql://user:password@localhost:5432/factory_os

# Anthropic (Required)
ANTHROPIC_API_KEY=sk-ant-...

# Optional for production
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Set Up Database

If using **Supabase** (recommended):
1. Create a new project at https://supabase.com
2. Get your database URL from Settings > Database
3. Update `.env` with the connection string

If using **local PostgreSQL**:
```bash
# Create database
createdb factory_os

# Run migrations
npm run db:generate
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Database Schema

The app uses Drizzle ORM with PostgreSQL. Key tables:

- `users` - User accounts and subscription info
- `lead_batches` - CSV upload batches
- `leads` - Individual leads with research results
- `jobs` - Background processing jobs
- `sequences` - Email/LinkedIn sequences
- `usage_metrics` - Monthly usage tracking

View schema: `lib/db/schema.ts`

## How It Works

### 1. Upload & Parse (Screen 1)

User uploads CSV with columns:
- `name` - Contact name (optional)
- `company` - Company name
- `website` - Company website URL (required)
- `linkedin_url` - LinkedIn profile (optional)
- `email` - Email address (optional)

File is parsed using PapaParse, validated, and stored in database.

### 2. Agent Processing (Screen 2)

For each lead, the system:

1. **Research Agent** (`lib/agents/research.ts`)
   - Crawls company website
   - Extracts value props, pain signals, ICP indicators
   - Uses Claude to analyze content

2. **Outreach Agent** (`lib/agents/outreach.ts`)
   - Generates personalized email/DM/call script
   - Tailored to lead's business and pain points
   - Human-sounding, concise copy

3. **Qualification Agent** (`lib/agents/qualification.ts`)
   - Scores lead fit (A/B/C)
   - Predicts objections
   - Recommends next steps

All orchestrated by `lib/agents/orchestrator.ts` which runs a single Claude API call for speed.

### 3. Results & Export (Screen 3)

Users can:
- View all leads with fit scores
- Filter by A/B/C tier
- Copy outreach messages
- Export to CSV
- Auto-send (Pro tier only)

## API Routes

### POST `/api/batches/create`
Upload CSV and create processing batch.

**Body (FormData):**
- `file` - CSV file
- `productDescription` - User's product description
- `outreachType` - email | linkedin | followup | call_script

**Response:**
```json
{
  "batchId": "uuid",
  "totalLeads": 10,
  "invalidLeads": 2
}
```

### GET `/api/batches/:batchId`
Get batch status and real-time progress.

**Response:**
```json
{
  "id": "uuid",
  "status": "processing",
  "totalLeads": 10,
  "processedLeads": 3,
  "leads": [...]
}
```

### GET `/api/batches/:batchId/results`
Get completed results for all leads.

**Response:**
```json
{
  "id": "uuid",
  "productDescription": "...",
  "outreachType": "email",
  "leads": [
    {
      "id": "uuid",
      "company": "Acme Corp",
      "fitScore": "A",
      "fitRationale": "...",
      "painPoints": ["..."],
      "outreachEmail": "...",
      "predictedObjections": ["..."],
      "recommendedNextStep": "..."
    }
  ]
}
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

### Environment Variables (Production)

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key

Optional:
- `STRIPE_SECRET_KEY` - For payments
- `NEXTAUTH_SECRET` - For auth
- `REDIS_URL` - For queue (future)

## Development Guide

### Adding New Agent Capabilities

1. Add prompt to `lib/agents/prompts.ts`
2. Create agent function in `lib/agents/`
3. Update orchestrator in `lib/agents/orchestrator.ts`
4. Update database schema if needed

### Adding New Integrations

1. Create integration file in `lib/integrations/`
2. Add API route in `app/api/integrations/`
3. Update UI in results page
4. Add to pricing/paywall

### Testing Agents

```bash
# Test with sample lead
node -e "
const { processLead } = require('./lib/agents/orchestrator');
processLead({
  productDescription: 'AI sales automation',
  outreachType: 'email',
  leadData: {
    company: 'Test Corp',
    website: 'https://example.com'
  }
}).then(console.log);
"
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Drizzle config
cat drizzle.config.ts
```

### Agent Processing Fails

Check:
1. `ANTHROPIC_API_KEY` is set correctly
2. API rate limits (Claude has 50 req/min on tier 1)
3. Website is accessible (some sites block bots)

### CSV Upload Fails

- Ensure CSV has header row
- Use UTF-8 encoding
- At least one of: website, company required
- Max file size: 10MB (configurable in next.config.js)

## Architecture Decisions

### Why Single API Call for Agents?

Instead of separate calls for Research → Outreach → Qualification, we use one Claude call with a comprehensive prompt. This:
- Reduces latency (3-5s vs 10-15s)
- Reduces API costs
- Simplifies error handling

For complex use cases, you can split into multiple calls.

### Why No Queue Initially?

v1 uses simple background processing in API routes. For production:
- Add BullMQ + Redis for proper queue
- Add Temporal for complex workflows
- Add webhook callbacks for long jobs

### Why Drizzle ORM?

- Type-safe SQL queries
- Better performance than Prisma
- Lighter weight
- Great PostgreSQL support

## Roadmap

**Week 1** (Current)
- ✅ Core agents
- ✅ CSV parsing
- ✅ Three-screen UI
- ✅ Real-time processing view

**Week 2**
- [ ] Auth (magic links)
- [ ] Stripe billing
- [ ] Email/CRM integrations
- [ ] Auto-send sequences
- [ ] Daily lead scans

**Week 3+**
- [ ] LinkedIn automation
- [ ] A/B testing outreach
- [ ] Multi-user teams
- [ ] Analytics dashboard
- [ ] API access

## Support

Questions? Check:
- README.md - Project overview
- lib/agents/prompts.ts - Agent behavior
- types/index.ts - Type definitions

## License

Proprietary - All rights reserved
