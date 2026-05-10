import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: 'https://www.getactcomply.com/privacy' },
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <nav className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-transparent px-6 py-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Who We Are</h2>
            <p>ActComply (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the platform at <strong>getactcomply.com</strong>. We are the data controller for personal data collected through this Service.</p>
            <p className="mt-2">Contact: <a href="mailto:privacy@getactcomply.com" className="text-blue-400 hover:underline">privacy@getactcomply.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-gray-900 dark:text-white">Account data:</strong> Email address, name (when provided)</li>
              <li><strong className="text-gray-900 dark:text-white">Payment data:</strong> Billing details processed by Stripe — we do not store card numbers</li>
              <li><strong className="text-gray-900 dark:text-white">Assessment data:</strong> Descriptions of AI systems you submit for compliance analysis</li>
              <li><strong className="text-gray-900 dark:text-white">Usage data:</strong> Pages visited, features used, timestamps — collected via cookies</li>
              <li><strong className="text-gray-900 dark:text-white">Communications:</strong> Support emails and messages you send us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and operate the Service</li>
              <li>To process payments and manage subscriptions</li>
              <li>To generate AI Act compliance assessments using your submitted information</li>
              <li>To send transactional emails (account confirmation, invoices, alerts)</li>
              <li>To improve the platform through aggregated usage analytics</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Legal Basis (GDPR)</h2>
            <p>For users in the European Economic Area and United Kingdom, we process your data under the following legal bases:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li><strong className="text-gray-900 dark:text-white">Contract performance:</strong> Processing necessary to deliver the Service you subscribed to</li>
              <li><strong className="text-gray-900 dark:text-white">Legitimate interests:</strong> Analytics, security, fraud prevention</li>
              <li><strong className="text-gray-900 dark:text-white">Legal obligation:</strong> Retaining transaction records as required by law</li>
              <li><strong className="text-gray-900 dark:text-white">Consent:</strong> Non-essential cookies (you may withdraw consent at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Third-Party Services</h2>
            <p>We share data with the following trusted processors:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li><strong className="text-gray-900 dark:text-white">Supabase</strong> — database and authentication (EU data residency available)</li>
              <li><strong className="text-gray-900 dark:text-white">Stripe</strong> — payment processing (PCI DSS compliant)</li>
              <li><strong className="text-gray-900 dark:text-white">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-gray-900 dark:text-white">Anthropic</strong> — AI processing of your assessment submissions (no data used for training)</li>
              <li><strong className="text-gray-900 dark:text-white">Vercel</strong> — platform hosting</li>
            </ul>
            <p className="mt-3">All processors are bound by data processing agreements and comply with GDPR requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active. After account deletion, data is purged within 30 days except where retention is required by law (e.g. financial records retained for 7 years).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights</h2>
            <p>Under GDPR and UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li><strong className="text-gray-900 dark:text-white">Access</strong> — request a copy of your personal data</li>
              <li><strong className="text-gray-900 dark:text-white">Rectification</strong> — correct inaccurate data</li>
              <li><strong className="text-gray-900 dark:text-white">Erasure</strong> — request deletion of your data</li>
              <li><strong className="text-gray-900 dark:text-white">Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong className="text-gray-900 dark:text-white">Objection</strong> — object to processing based on legitimate interests</li>
              <li><strong className="text-gray-900 dark:text-white">Restriction</strong> — request we limit processing in certain circumstances</li>
            </ul>
            <p className="mt-3">To exercise any right, email <a href="mailto:privacy@getactcomply.com" className="text-blue-400 hover:underline">privacy@getactcomply.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Cookies</h2>
            <p>We use the following cookies:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li><strong className="text-gray-900 dark:text-white">Essential:</strong> Authentication session cookies — required for the Service to function</li>
              <li><strong className="text-gray-900 dark:text-white">Functional:</strong> Preferences and settings (consent to this category via our cookie banner)</li>
            </ul>
            <p className="mt-3">You can withdraw consent for non-essential cookies at any time by clearing your browser cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. International Transfers</h2>
            <p>Some of our processors operate outside the EEA. Where data is transferred internationally, we ensure appropriate safeguards are in place including Standard Contractual Clauses (SCCs) approved by the European Commission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you by email of material changes at least 14 days before they take effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p>For privacy-related questions or to exercise your rights: <a href="mailto:privacy@getactcomply.com" className="text-blue-400 hover:underline">privacy@getactcomply.com</a></p>
          </section>

        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8 mt-8">
        <div className="max-w-4xl mx-auto flex gap-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300 transition">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
          <Link href="/" className="hover:text-gray-300 transition">Home</Link>
        </div>
      </footer>
    </div>
  )
}
