import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'Terms of Service — ActComply',
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Agreement</h2>
            <p>By accessing or using ActComply (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including individuals and organisations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Service Description</h2>
            <p>ActComply provides an AI-powered platform to assist organisations in assessing and documenting their AI systems against the EU AI Act. The Service generates risk classifications, compliance checklists, and documentation templates based on information you provide.</p>
            <p className="mt-3 text-yellow-400/80 text-sm border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
              <strong>Important:</strong> ActComply is an informational and workflow tool. It does not constitute legal advice. You should consult a qualified legal professional for advice specific to your situation. We make no guarantee that use of this Service ensures regulatory compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activity under it. Notify us immediately at <a href="mailto:support@getactcomply.com" className="text-blue-400 hover:underline">support@getactcomply.com</a> if you suspect unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Subscriptions and Payment</h2>
            <p>Subscriptions are billed in advance on a monthly or annual basis. All prices are in EUR. Payments are processed securely by Stripe. Subscriptions renew automatically unless cancelled before the renewal date.</p>
            <p className="mt-3">You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period — no refunds are issued for partial periods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
              <li>Use the Service for unlawful purposes</li>
              <li>Attempt to reverse-engineer or copy the platform</li>
              <li>Submit false or misleading information about your AI systems</li>
              <li>Resell or sublicense access to the Service without written permission</li>
              <li>Interfere with or disrupt the integrity of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
            <p>All content, software, and materials provided by ActComply are our intellectual property or that of our licensors. You retain ownership of data you submit. You grant us a limited licence to process your data to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, ActComply&apos;s total liability to you for any claim arising from use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Termination</h2>
            <p>We may suspend or terminate your account if you breach these Terms. You may terminate your account at any time. Upon termination, your access to the Service will cease and your data may be deleted after 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you by email at least 14 days before material changes take effect. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@getactcomply.com" className="text-blue-400 hover:underline">support@getactcomply.com</a>.</p>
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
