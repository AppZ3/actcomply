import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DpaPrintButton } from './print-button'

export default async function DpaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Data Processing Agreement</h1>
          <p className="text-gray-400 text-sm">Article 28 GDPR — ActComply as your data processor</p>
        </div>
        <DpaPrintButton />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 text-sm text-gray-300 leading-relaxed print:bg-white print:text-gray-900 print:border-gray-300">

        <div className="text-center pb-6 border-b border-white/10 print:border-gray-300">
          <h2 className="text-xl font-bold text-white print:text-gray-900 mb-1">DATA PROCESSING AGREEMENT</h2>
          <p className="text-gray-400 print:text-gray-600">Pursuant to Article 28 of Regulation (EU) 2016/679 (GDPR)</p>
          <p className="text-gray-400 print:text-gray-600 mt-1">Effective date: {today}</p>
        </div>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">1. Parties</h3>
          <p>
            This Data Processing Agreement (&quot;DPA&quot;) is entered into between:
          </p>
          <div className="mt-3 ml-4 space-y-3">
            <div>
              <span className="font-semibold text-white print:text-gray-900">Data Controller:</span> The customer identified by the account email{' '}
              <span className="font-mono text-blue-400 print:text-blue-600">{user.email}</span>{' '}
              (&quot;Controller&quot; or &quot;you&quot;), who has agreed to the ActComply Terms of Service.
            </div>
            <div>
              <span className="font-semibold text-white print:text-gray-900">Data Processor:</span> ActComply (operated by its registered entity), a software-as-a-service provider offering EU AI Act compliance tooling, accessible at getactcomply.com (&quot;Processor&quot; or &quot;ActComply&quot;).
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">2. Subject Matter and Duration</h3>
          <p>
            This DPA governs the processing of personal data by ActComply on behalf of the Controller in connection with the provision of the ActComply compliance platform. Processing will continue for the duration of the Controller&apos;s active subscription and for any retention period required by applicable law or agreed in writing.
          </p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">3. Nature and Purpose of Processing</h3>
          <p>ActComply processes personal data solely to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Provide, maintain, and improve the compliance platform and its features;</li>
            <li>Store assessment inputs, compliance records, audit trails, incident logs, and documents created by the Controller;</li>
            <li>Send compliance alerts, regulatory update notifications, and transactional emails;</li>
            <li>Generate AI-assisted compliance documentation based on inputs supplied by the Controller;</li>
            <li>Process payments via Stripe (as an independent controller for payment data).</li>
          </ul>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">4. Categories of Data Subjects and Personal Data</h3>
          <div className="space-y-2">
            <p><span className="font-semibold text-white print:text-gray-900">Data subjects:</span> The Controller&apos;s account users, and any individuals whose personal data the Controller inputs into the platform (e.g., AI system operators, affected persons described in assessments).</p>
            <p><span className="font-semibold text-white print:text-gray-900">Categories of data:</span> Account credentials (email address, hashed password), usage data, compliance assessment inputs and outputs, uploaded documentation, audit events, and any special categories of data that the Controller elects to include in assessment descriptions (ActComply does not require special category data and recommends against including it).</p>
          </div>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">5. Obligations of the Processor</h3>
          <p>ActComply shall:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Process personal data only on documented instructions from the Controller, including with regard to transfers of personal data to third countries;</li>
            <li>Ensure that persons authorised to process personal data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality;</li>
            <li>Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including encryption of data at rest and in transit, access controls, and regular security reviews;</li>
            <li>Not engage any sub-processor without prior specific or general written authorisation of the Controller (see Section 7);</li>
            <li>Assist the Controller, by appropriate technical and organisational measures, in fulfilling the Controller&apos;s obligation to respond to requests for exercising data subject rights;</li>
            <li>Assist the Controller in ensuring compliance with Articles 32–36 GDPR (security, breach notification, DPIAs, prior consultation);</li>
            <li>At the choice of the Controller, delete or return all personal data after the end of the provision of services, and delete existing copies unless EU or Member State law requires storage;</li>
            <li>Make available to the Controller all information necessary to demonstrate compliance with Article 28 GDPR, and allow for and contribute to audits and inspections conducted by the Controller or an auditor mandated by the Controller.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">6. Controller Obligations</h3>
          <p>The Controller represents and warrants that it has a lawful basis for processing the personal data it submits to ActComply, has provided any required notices to data subjects, and has the authority to enter into this DPA on behalf of its organisation.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">7. Sub-processors</h3>
          <p>The Controller grants general written authorisation for ActComply to engage the following sub-processors:</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-white/10 print:border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-white/5 print:bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Sub-processor</th>
                  <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Purpose</th>
                  <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 print:divide-gray-200">
                <tr>
                  <td className="px-4 py-2">Supabase Inc.</td>
                  <td className="px-4 py-2">Database hosting and authentication</td>
                  <td className="px-4 py-2">EU (Frankfurt)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Vercel Inc.</td>
                  <td className="px-4 py-2">Application hosting and edge delivery</td>
                  <td className="px-4 py-2">EU regions available</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Anthropic PBC</td>
                  <td className="px-4 py-2">AI model inference for document generation</td>
                  <td className="px-4 py-2">United States</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Resend Inc.</td>
                  <td className="px-4 py-2">Transactional email delivery</td>
                  <td className="px-4 py-2">United States</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Stripe Inc.</td>
                  <td className="px-4 py-2">Payment processing (independent controller)</td>
                  <td className="px-4 py-2">United States</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">ActComply will inform the Controller of any intended changes concerning the addition or replacement of sub-processors, giving the Controller the opportunity to object. Transfers to sub-processors in third countries are subject to appropriate safeguards (Standard Contractual Clauses or adequacy decisions).</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">8. International Transfers</h3>
          <p>Where personal data is transferred outside the European Economic Area (EEA) to sub-processors in third countries (notably the United States), such transfers rely on the EU–US Data Privacy Framework adequacy decision (where applicable) or the European Commission&apos;s Standard Contractual Clauses (SCCs) pursuant to Commission Implementing Decision 2021/914.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">9. Security Measures</h3>
          <p>ActComply implements the following technical and organisational security measures:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Encryption of data at rest (AES-256) and in transit (TLS 1.2+);</li>
            <li>Row-level security enforced at the database layer;</li>
            <li>Role-based access controls limiting internal access to personal data;</li>
            <li>Supabase authentication with bcrypt-hashed credentials;</li>
            <li>Regular dependency updates and vulnerability scanning;</li>
            <li>Incident response and breach notification procedures.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">10. Data Breach Notification</h3>
          <p>In the event of a personal data breach, ActComply shall notify the Controller without undue delay and, where feasible, no later than 72 hours after becoming aware of the breach. The notification shall include all information required by Article 33(3) GDPR to the extent available at the time of notification.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">11. Data Subject Rights</h3>
          <p>ActComply will assist the Controller in responding to data subject rights requests. The Controller remains responsible for responding to such requests. Data subjects may exercise their rights by contacting the Controller directly. Where ActComply receives a request directly, it will forward it to the Controller within 5 business days.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">12. Deletion and Return of Data</h3>
          <p>Upon termination of the Controller&apos;s subscription, ActComply will retain assessment data for 30 days to allow export, after which it will be deleted from production systems. Backup copies will be purged within 90 days. The Controller may use the JSON export feature at any time to obtain a machine-readable copy of all their compliance records.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">13. Audit Rights</h3>
          <p>ActComply shall make available to the Controller all information necessary to demonstrate compliance with this DPA. The Controller may request an audit no more than once per calendar year upon 30 days&apos; written notice. ActComply may satisfy this obligation by providing relevant certifications, security documentation, or written attestations in lieu of an on-site audit.</p>
        </section>

        <section>
          <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">14. Governing Law</h3>
          <p>This DPA shall be governed by the laws of the European Union and, where applicable, the laws of the jurisdiction in which the Controller is established. Any disputes shall be resolved in accordance with the applicable supervisory authority&apos;s guidance or competent courts.</p>
        </section>

        <div className="pt-6 border-t border-white/10 print:border-gray-300">
          <p className="text-gray-400 print:text-gray-600 text-xs">
            This DPA forms part of and is incorporated into the ActComply Terms of Service. By using ActComply, the Controller agrees to the terms of this DPA. For questions, contact{' '}
            <a href="mailto:zaclowe@outlook.com.au" className="text-blue-400 hover:text-blue-300 print:text-blue-600">
              zaclowe@outlook.com.au
            </a>.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-8 text-xs text-gray-400 print:text-gray-600">
            <div>
              <div className="font-semibold text-white print:text-gray-900 mb-1">Data Processor</div>
              <div>ActComply</div>
              <div>getactcomply.com</div>
              <div className="mt-4 border-t border-white/10 print:border-gray-300 pt-2">Signature: _______________________</div>
            </div>
            <div>
              <div className="font-semibold text-white print:text-gray-900 mb-1">Data Controller</div>
              <div>{user.email}</div>
              <div className="mt-4 border-t border-white/10 print:border-gray-300 pt-2">Signature: _______________________</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
