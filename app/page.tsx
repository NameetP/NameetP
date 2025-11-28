import Link from 'next/link';
import { ArrowRight, Zap, Target, TrendingUp, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Factory OS</div>
        <nav className="flex gap-6">
          <Link href="#how-it-works" className="hover:text-gray-300">How It Works</Link>
          <Link href="#pricing" className="hover:text-gray-300">Pricing</Link>
          <Link href="/app" className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Turn Any Lead List<br />Into Revenue — Automatically
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Factory OS finds decision-makers, researches their companies, writes personalized outreach, and qualifies every lead. All in 30 seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/app"
            className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-200 font-semibold text-lg flex items-center gap-2"
          >
            Start Free — Generate 20 Leads
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#demo"
            className="border border-gray-600 px-8 py-4 rounded-lg hover:border-gray-400 font-semibold text-lg"
          >
            See Sample Outputs
          </Link>
        </div>
      </section>

      {/* The Problem */}
      <section className="container mx-auto px-4 py-20 bg-gray-800/50 rounded-3xl my-20">
        <h2 className="text-4xl font-bold mb-12 text-center">The Problem</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="text-lg text-gray-300 space-y-4">
            <p>SMBs waste hours writing cold emails that don't convert.</p>
            <p>Productivity dies in CRMs.</p>
            <p>Research takes forever.</p>
            <p>Follow-ups never happen.</p>
          </div>
          <div className="text-lg text-white space-y-4 font-medium">
            <p>✓ Instant personalization at scale</p>
            <p>✓ AI-powered research & qualification</p>
            <p>✓ Zero manual work</p>
            <p>✓ Automatic follow-up sequences</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {[
            { step: '1', title: 'Upload Leads', icon: '📤', desc: 'CSV with company info' },
            { step: '2', title: 'Agent Researches', icon: '🔍', desc: 'Crawls websites, finds pain' },
            { step: '3', title: 'Generates Outreach', icon: '✍️', desc: 'Personalized emails & DMs' },
            { step: '4', title: 'Scores & Qualifies', icon: '🎯', desc: 'A/B/C fit scoring' },
            { step: '5', title: '1-Click Send', icon: '🚀', desc: 'Launch sequences' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl mb-4">{item.icon}</div>
              <div className="text-sm text-gray-400 mb-2">Step {item.step}</div>
              <div className="font-semibold mb-2">{item.title}</div>
              <div className="text-sm text-gray-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Promise */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">The Promise</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-2xl font-semibold">
          <div>
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-400" />
            More replies
          </div>
          <div>
            <Target className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            More meetings
          </div>
          <div>
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            More revenue
          </div>
          <div>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            No extra hires
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Pricing</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              tier: 'Free',
              price: '$0',
              leads: '20 leads/mo',
              features: ['Email + DM generation', 'Export only', 'No auto-send', 'No CRM integration'],
              cta: 'Start Free',
              highlight: false,
            },
            {
              tier: 'Pro',
              price: '$39',
              leads: '500 leads/mo',
              features: ['Auto-send sequences', 'Gmail/Outlook', 'Basic CRM push', 'Call scripts', 'Daily scans'],
              cta: 'Start Pro',
              highlight: true,
            },
            {
              tier: 'Growth',
              price: '$99',
              leads: '2,500 leads/mo',
              features: ['Multi-channel sequences', 'Parallel agents', 'AI qualification', 'Priority support'],
              cta: 'Start Growth',
              highlight: false,
            },
            {
              tier: 'Scale',
              price: '$299',
              leads: 'Unlimited leads',
              features: ['Dedicated tuning', 'SDR reporting', 'Multi-brand', 'Multi-user', 'Admin controls'],
              cta: 'Start Scale',
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-white text-black border-4 border-white transform scale-105'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.tier}</h3>
              <div className="text-4xl font-bold mb-1">{plan.price}</div>
              <div className={`text-sm mb-6 ${plan.highlight ? 'text-gray-700' : 'text-gray-400'}`}>
                {plan.leads}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className={`block w-full py-3 rounded-lg font-semibold text-center ${
                  plan.highlight
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">Ready to 10x Your Outreach?</h2>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 bg-white text-black px-12 py-5 rounded-lg hover:bg-gray-200 font-bold text-xl"
        >
          Start Free — Generate 20 Leads
          <ArrowRight className="w-6 h-6" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-800 text-center text-gray-400">
        <p>&copy; 2024 Factory OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
