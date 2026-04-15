import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const TEMPLATES: Record<string, {
  title: string
  article: string
  description: string
  sections: { heading: string; guidance: string; example: string }[]
}> = {
  'risk-management': {
    title: 'Risk Management System',
    article: 'Article 9',
    description: 'Article 9 requires providers of high-risk AI systems to establish, implement, document, and maintain a risk management system throughout the entire lifecycle.',
    sections: [
      {
        heading: '1. Risk Identification Methodology',
        guidance: 'Describe how you identify risks associated with your AI system. This must cover risks to health, safety, and fundamental rights of affected persons. Include both foreseeable and reasonably foreseeable misuse scenarios.',
        example: 'We conduct structured risk identification workshops at each development milestone, using a combination of FMEA (Failure Mode and Effects Analysis) and scenario analysis. Risks are categorised by likelihood (1–5) and severity (1–5), producing a risk priority number for each identified risk.',
      },
      {
        heading: '2. Risk Analysis and Evaluation Criteria',
        guidance: 'Document the criteria used to evaluate whether identified risks are acceptable. Reference relevant standards (e.g., ISO 31000, ISO/IEC 23894) where applicable.',
        example: 'Risks with an RPN above 15 are classified as unacceptable and require mitigation before deployment. We reference ISO 31000:2018 for risk evaluation methodology and ISO/IEC 23894:2023 for AI-specific guidance.',
      },
      {
        heading: '3. Risk Mitigation Measures',
        guidance: 'For each identified risk, document the technical and/or organisational measures taken to reduce it. Measures must be implemented in the design and development phase where possible.',
        example: 'Technical measures include: input validation to reject out-of-distribution data, output confidence thresholding, adversarial robustness testing, and model monitoring dashboards. Organisational measures include mandatory human review for high-stakes decisions and documented escalation procedures.',
      },
      {
        heading: '4. Residual Risk Assessment',
        guidance: 'After applying mitigation measures, document the residual risk level and confirm it is acceptable. If residual risks remain, document why they are justified and what compensating controls are in place.',
        example: 'After mitigation, all risks have been reduced to an RPN below 10. Residual risks are considered acceptable given the compensating controls in place (human oversight, audit logging, and model monitoring). A formal residual risk sign-off is documented in our change management system.',
      },
      {
        heading: '5. Post-Market Monitoring Plan',
        guidance: 'Describe how risks will be monitored once the system is deployed. Include feedback mechanisms, incident reporting procedures, and thresholds for triggering a risk review.',
        example: 'We monitor model performance weekly using a dashboard tracking accuracy, drift, and user complaint rates. Any accuracy drop >5% or complaint rate >0.1% triggers an immediate risk review. Incidents are logged and reported to the AI governance committee within 24 hours.',
      },
    ],
  },
  'conformity-declaration': {
    title: 'EU Declaration of Conformity',
    article: 'Article 47',
    description: 'Article 47 requires providers to draw up an EU declaration of conformity before placing a high-risk AI system on the market. It must be kept for 10 years after the system is placed on the market.',
    sections: [
      {
        heading: '1. Provider Identification',
        guidance: 'Full legal name and registered address of the provider (the entity that places the system on the market or puts it into service).',
        example: 'Provider: [Your Company Legal Name]\nRegistered address: [Full address]\nContact person: [Name, email, phone]\nEU representative (if non-EU provider): [Name and address]',
      },
      {
        heading: '2. AI System Identification',
        guidance: 'Name, version, and unique identifier of the AI system. If the system is part of a product, include the product details.',
        example: 'AI System name: [System Name]\nVersion: [v1.0.0]\nUnique identifier: [Your internal ID or EU AI database ID]\nIntended purpose: [Brief description]\nRisk classification: High-Risk (Annex III, [specific category])',
      },
      {
        heading: '3. Applicable Regulations and Standards',
        guidance: 'List the EU regulations, harmonised standards, and common specifications the declaration of conformity relates to.',
        example: 'This declaration relates to:\n- EU AI Act (Regulation 2024/1689), Articles 9–27, 43\n- [Any harmonised standards applied, e.g. ISO/IEC 42001:2023]\n- [Any other applicable EU regulations, e.g. GDPR if processing personal data]',
      },
      {
        heading: '4. Conformity Assessment Procedure',
        guidance: 'Describe which conformity assessment procedure was followed (internal control under Annex VI, or third-party assessment by a notified body under Annex VII). If a notified body was involved, include their name and identification number.',
        example: 'Conformity assessment procedure: Internal control (Annex VI, Article 43(2))\n[OR]\nThird-party assessment by: [Notified body name], ID: [NB number]\nCertificate number: [Certificate reference]',
      },
      {
        heading: '5. Authorised Signatory',
        guidance: 'The declaration must be signed by a person authorised to sign on behalf of the provider. Include their name, title, and date.',
        example: 'I, the undersigned, hereby declare that the AI system identified above is in conformity with the applicable provisions of Regulation (EU) 2024/1689.\n\nSigned by: [Full name]\nTitle: [CEO / Chief Compliance Officer / etc.]\nDate: [DD/MM/YYYY]\nLocation: [City, Country]',
      },
    ],
  },
  'data-governance': {
    title: 'Data Governance Policy',
    article: 'Article 10',
    description: 'Article 10 requires high-risk AI systems to use training, validation, and testing data that meets quality criteria. Providers must document their data governance practices.',
    sections: [
      {
        heading: '1. Data Collection and Sourcing',
        guidance: 'Document where your training, validation, and testing data comes from. Include data sources, collection methods, and any third-party data providers.',
        example: 'Training data is sourced from: (1) internal historical records collected [date range], (2) licensed third-party dataset from [provider], (3) publicly available datasets: [list]. All data collection activities comply with GDPR and applicable national law. Third-party data agreements are maintained on file.',
      },
      {
        heading: '2. Data Quality Criteria',
        guidance: 'Define the quality standards your data must meet before being used for training or testing. Address relevance, representativeness, completeness, and accuracy.',
        example: 'Data quality requirements: minimum 95% completeness (no missing values on critical fields), accuracy verified against source records, representative of the intended deployment population (demographic balance confirmed by [method]), and free from known systematic errors. Quality checks are automated and run on each dataset ingestion.',
      },
      {
        heading: '3. Bias Examination Procedures',
        guidance: 'Article 10(2)(f) specifically requires examination of biases that could affect health, safety, or fundamental rights. Document how you detect, measure, and address bias.',
        example: 'We conduct bias audits at each major model version using: (1) disparate impact analysis across protected characteristics (gender, age, ethnicity, disability), (2) counterfactual fairness testing, (3) independent third-party review annually. Bias thresholds: disparate impact ratio must be ≥0.8 for all protected groups. Any breach triggers retraining before deployment.',
      },
      {
        heading: '4. Data Governance Processes',
        guidance: 'Describe the processes for managing data throughout its lifecycle — including labelling, annotation quality, version control, and data access controls.',
        example: 'Data versioning: all datasets are versioned in [tool, e.g. DVC]. Annotation quality: minimum inter-annotator agreement of 0.85 Cohen\'s kappa. Data access: controlled via role-based access, audit logged. Retention: raw data retained for 7 years post-deployment. Deletion requests processed within 30 days.',
      },
      {
        heading: '5. Personal Data Handling',
        guidance: 'If your system processes personal data, document the GDPR lawful basis, data minimisation measures, and how data subject rights are handled.',
        example: 'Lawful basis: [legitimate interests / consent / contract]. Personal data is pseudonymised before use in training. Data minimisation: only fields necessary for the intended purpose are retained. Data subject rights requests are handled by [team/role] within [timeframe]. A DPIA (Data Protection Impact Assessment) was conducted on [date].',
      },
    ],
  },
  'human-oversight': {
    title: 'Human Oversight Protocol',
    article: 'Article 14',
    description: 'Article 14 requires high-risk AI systems to be designed to allow effective human oversight. Providers must implement tools and procedures enabling operators to understand, monitor, and intervene.',
    sections: [
      {
        heading: '1. Oversight Roles and Responsibilities',
        guidance: 'Define who is responsible for overseeing the AI system in operation. Include role titles, their qualifications, and their oversight responsibilities.',
        example: 'AI System Owner: [Role/Name] — accountable for overall system governance and compliance.\nOperational Supervisors: [Role] — responsible for day-to-day monitoring of system outputs.\nAI Safety Officer: [Role] — responsible for incident escalation and regulatory reporting.\nAll oversight personnel complete mandatory AI literacy training ([course name], [hours]) before assuming oversight duties.',
      },
      {
        heading: '2. Monitoring Procedures',
        guidance: 'Describe how human overseers monitor the system during operation. Include what metrics are monitored, how often, and what dashboards or tools are used.',
        example: 'Monitoring cadence: real-time dashboard reviewed continuously during business hours; automated alerts for anomalies. Metrics monitored: output confidence scores, decision rates by category, anomaly flags, user complaint rate. Weekly manual review of a 5% random sample of outputs by operational supervisors. Monthly performance review by AI System Owner.',
      },
      {
        heading: '3. Intervention Triggers',
        guidance: 'Define the specific conditions that require a human overseer to intervene and the expected response time.',
        example: 'Immediate intervention required when: (1) confidence score below [threshold], (2) anomaly detection flag triggered, (3) user reports potential error. Response time: immediate alerts acknowledged within 15 minutes; investigation completed within 4 hours; escalation to AI Safety Officer if unresolved within 8 hours.',
      },
      {
        heading: '4. Override and Stop Procedures',
        guidance: 'Document the procedures for overriding or stopping the AI system. Article 14(4)(e) requires the ability to halt the system via a "stop" button or similar procedure.',
        example: 'Manual override: operational supervisors can override any individual system output using the override function in [system name]. System halt: the AI Safety Officer and AI System Owner have authority to halt the system entirely via [procedure]. Halt takes effect within [timeframe]. All overrides and halts are logged automatically with reason code and user ID.',
      },
      {
        heading: '5. Training Requirements for Operators',
        guidance: 'Describe the training users and operators must complete before using or overseeing the system. Include content, duration, and refresh frequency.',
        example: 'Initial training: 4-hour mandatory course covering system purpose, limitations, bias risks, and oversight procedures. Competency assessment required to pass (≥80%). Refresh training: annually, or following any significant system update. Training records maintained for the duration of employment plus 3 years. Training materials reviewed and updated with each major system version.',
      },
    ],
  },
  'risk-management-system': {
    title: 'Risk Management System',
    article: 'Article 9',
    description: 'Duplicate route fallback — see risk-management.',
    sections: [],
  },
}

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (!profile?.plan || profile.plan === 'free') redirect('/dashboard/guidance')

  const template = TEMPLATES[id]
  if (!template || template.sections.length === 0) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/guidance" className="text-sm text-gray-400 hover:text-white transition">
          ← Guidance
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{template.title}</h1>
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{template.article}</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{template.description}</p>
      </div>

      <div className="space-y-6">
        {template.sections.map((section, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold mb-3">{section.heading}</h2>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Guidance</p>
              <p className="text-sm text-gray-300 leading-relaxed">{section.guidance}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example wording</p>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{section.example}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
        <p className="text-xs text-yellow-400/80">
          These templates provide guidance and example wording only. They do not constitute legal advice. Engage a qualified EU AI Act legal specialist to review your final documentation before submission to regulators.
        </p>
      </div>
    </div>
  )
}
