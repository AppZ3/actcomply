import { PrintButton } from '../print-button'

export default function PartnerAgreementTemplatePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white print:bg-white print:text-gray-900">
      <div className="max-w-4xl mx-auto px-8 py-12">

        <div className="flex items-start justify-between gap-4 mb-10 print:hidden">
          <div>
            <div className="text-xs text-gray-500 mb-1">ActComply · Partner Program</div>
            <h1 className="text-2xl font-bold">Partner Referral Agreement</h1>
            <p className="text-gray-400 text-sm mt-1">Standard template</p>
          </div>
          <PrintButton />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 space-y-7 text-sm text-gray-300 leading-relaxed print:bg-white print:text-gray-900 print:border-gray-300 print:rounded-none print:p-0">

          <div className="text-center pb-8 border-b border-white/10 print:border-gray-300">
            <h2 className="text-2xl font-bold text-white print:text-gray-900 mb-1">PARTNER REFERRAL AGREEMENT</h2>
            <p className="text-gray-400 print:text-gray-600 mt-1">Effective date: ___________________</p>
          </div>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">1. Parties</h3>
            <p>This Partner Referral Agreement (&quot;Agreement&quot;) is entered into between:</p>
            <div className="mt-3 ml-4 space-y-3">
              <div>
                <span className="font-semibold text-white print:text-gray-900">ActComply</span> — EU AI Act compliance platform, operated by its registered entity, accessible at getactcomply.com (&quot;ActComply&quot; or &quot;Company&quot;); and
              </div>
              <div>
                <span className="font-semibold text-white print:text-gray-900">[Partner Name]</span> — [Partner description] (&quot;Partner&quot; or &quot;Referrer&quot;).
              </div>
            </div>
            <p className="mt-3">Each a &quot;Party&quot;; together the &quot;Parties&quot;.</p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">2. Purpose</h3>
            <p>
              The Partner agrees to refer clients to ActComply&apos;s EU AI Act compliance platform in exchange for referral commissions as set out herein. ActComply agrees to pay commissions on qualifying referred subscriptions.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">3. Referral Process</h3>
            <ol className="list-decimal ml-6 space-y-2">
              <li>The Partner shall refer prospective customers (&quot;Referrals&quot;) to ActComply by directing them to getactcomply.com using a unique referral link or code provided by ActComply, or by making a written introduction by email (cc&apos;ing ActComply&apos;s designated contact).</li>
              <li>A Referral is deemed &quot;qualified&quot; when the referred individual or entity subscribes to a paid ActComply plan within 60 days of the initial introduction.</li>
              <li>Each Referral must be a new customer with no prior paid subscription to ActComply. Referrals of existing customers, including plan upgrades, do not qualify unless otherwise agreed in writing.</li>
              <li>ActComply reserves the right to verify referral attribution. In the event of duplicate attribution, the earliest recorded introduction takes precedence.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">4. Commission</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 print:border-gray-300 rounded-lg overflow-hidden mb-4">
                <thead className="bg-white/5 print:bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Plan</th>
                    <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Monthly</th>
                    <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Annual</th>
                    <th className="text-left px-4 py-2 text-white print:text-gray-900 font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 print:divide-gray-200">
                  <tr>
                    <td className="px-4 py-2">Starter</td>
                    <td className="px-4 py-2">€499/mo</td>
                    <td className="px-4 py-2">€4,990/yr</td>
                    <td className="px-4 py-2 font-semibold text-green-400 print:text-green-700">15% of first 12 months</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Business</td>
                    <td className="px-4 py-2">€1,499/mo</td>
                    <td className="px-4 py-2">€14,990/yr</td>
                    <td className="px-4 py-2 font-semibold text-green-400 print:text-green-700">15% of first 12 months</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Enterprise</td>
                    <td className="px-4 py-2">€2,999/mo</td>
                    <td className="px-4 py-2">€29,990/yr</td>
                    <td className="px-4 py-2 font-semibold text-green-400 print:text-green-700">15% of first 12 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Commission is calculated on net revenue received by ActComply (after payment processing fees and applicable taxes). Commissions are paid monthly in arrears, no later than the 15th day of the following month, once cumulative commissions owed exceed €50. Amounts below €50 carry forward to the next payment cycle.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">5. Payment</h3>
            <p>
              ActComply will pay commissions via bank transfer or such other method agreed in writing. The Partner shall provide accurate payment details and notify ActComply of any changes. ActComply is not responsible for delayed or failed payments due to incorrect payment information.
            </p>
            <p className="mt-2">
              The Partner is solely responsible for any taxes applicable to commissions received, including income tax, GST, VAT, or equivalent obligations in the Partner&apos;s jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">6. Sandbox Account</h3>
            <p>
              ActComply will provide the Partner with a complimentary Business-tier sandbox account (&quot;Sandbox Account&quot;) for the duration of this Agreement. The Sandbox Account is for demonstration, evaluation, and client presentation purposes only. It may not be used to process commercial client engagements without a separate paid subscription.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">7. Partner Obligations</h3>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Represent ActComply&apos;s services accurately and in accordance with publicly available marketing materials;</li>
              <li>Not make warranties or commitments on behalf of ActComply beyond those contained in ActComply&apos;s published Terms of Service;</li>
              <li>Not engage in spam, unsolicited mass communications, or deceptive marketing practices in connection with referrals;</li>
              <li>Promptly notify ActComply of any complaints or concerns raised by Referrals.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">8. Confidentiality</h3>
            <p>
              Each Party agrees to keep the terms of this Agreement and any non-public information disclosed by the other Party (&quot;Confidential Information&quot;) confidential, and not to disclose it to third parties without prior written consent, except as required by law or regulation. This obligation survives termination of the Agreement for a period of two (2) years.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">9. Term and Termination</h3>
            <p>
              This Agreement commences on the Effective Date and continues for an initial term of twelve (12) months, renewing automatically for successive twelve-month periods unless terminated by either Party with thirty (30) days&apos; written notice.
            </p>
            <p className="mt-2">
              Upon termination, commissions accrued for Referrals who subscribed before the termination date will be paid out in accordance with Section 4 for their first 12 months of subscription. No new referral commissions accrue after the termination date.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">10. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, neither Party shall be liable to the other for indirect, incidental, special, consequential, or punitive damages arising out of or related to this Agreement. ActComply&apos;s total liability under this Agreement shall not exceed the total commissions paid to the Partner in the three (3) months preceding the claim.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">11. Governing Law</h3>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which ActComply is registered, without regard to its conflict of law provisions. Any disputes shall be resolved by good-faith negotiation, followed by mediation if negotiation fails.
            </p>
          </section>

          <section>
            <h3 className="text-white print:text-gray-900 font-semibold text-base mb-3">12. Entire Agreement</h3>
            <p>
              This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior discussions, representations, or agreements. Amendments must be in writing and signed by both Parties.
            </p>
          </section>

          <div className="pt-8 border-t border-white/10 print:border-gray-300">
            <div className="grid grid-cols-2 gap-10 text-sm">
              <div>
                <div className="font-semibold text-white print:text-gray-900 mb-3">ActComply</div>
                <div className="text-gray-400 print:text-gray-600 space-y-1">
                  <div>getactcomply.com</div>
                  <div>hello@getactcomply.com</div>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Signature</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Name &amp; Title</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-white print:text-gray-900 mb-3">[Partner Name]</div>
                <div className="text-gray-400 print:text-gray-600 space-y-1">
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Signature</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Name &amp; Title</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="border-b border-white/20 print:border-gray-400 h-8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
