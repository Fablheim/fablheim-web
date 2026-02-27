import { LegalCallout, LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

const toc = [
  { id: 'information-collect', label: '1. Information We Collect' },
  { id: 'use-information', label: '2. How We Use Your Information' },
  { id: 'ai-processing', label: '3. AI Data Processing' },
  { id: 'data-sharing', label: '4. Data Sharing' },
  { id: 'data-security', label: '5. Data Security' },
  { id: 'retention', label: '6. Data Retention and Deletion' },
  { id: 'cookies-storage', label: '7. Cookies and Local Storage' },
  { id: 'childrens-privacy', label: "8. Children's Privacy" },
  { id: 'your-rights', label: '9. Your Rights' },
  { id: 'policy-changes', label: '10. Changes to This Policy' },
  { id: 'contact', label: '11. Contact' },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="February 2026"
      intro="This policy explains what information Fablheim collects, how it is used, and what controls you have."
      toc={toc}
    >
      <LegalSection id="information-collect" title="1. Information We Collect">
        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Account Information</h3>
        <p>
          When you create an account, we collect your email address, username, and display name. Passwords are stored
          using bcrypt hashing and are never stored in plain text.
        </p>

        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Campaign Data</h3>
        <p>
          We store content you create on the Platform: campaigns, characters, session notes, world-building entries,
          dice roll history, chat messages, and uploaded images. This data is necessary to provide the service.
        </p>

        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Usage Data</h3>
        <p>
          We collect basic usage analytics including page views, feature usage, AI credit consumption, and session
          duration. This data is used to improve the Platform.
        </p>
      </LegalSection>

      <LegalSection id="use-information" title="2. How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide, maintain, and improve the Platform</li>
          <li>Process transactions and manage subscriptions</li>
          <li>Send service-related notifications (password resets, billing alerts)</li>
          <li>Generate AI-powered content at your request</li>
          <li>Respond to support inquiries</li>
        </ul>
      </LegalSection>

      <LegalSection id="ai-processing" title="3. AI Data Processing">
        <p>
          When you use AI-powered features, your campaign context (session notes, character details, world entities) is
          sent to Anthropic's API for processing. Important points:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Data sent to Anthropic is not used to train AI models</li>
          <li>AI processing occurs in real-time and is not stored by Anthropic</li>
          <li>You can use all non-AI features without any data being sent to third parties</li>
          <li>
            Refer to{' '}
            <a
              href="https://www.anthropic.com/policies/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]"
            >
              Anthropic's privacy policy
            </a>{' '}
            for details on their data handling
          </li>
        </ul>
        <LegalCallout>AI processing is optional. Core non-AI platform features remain available.</LegalCallout>
      </LegalSection>

      <LegalSection id="data-sharing" title="4. Data Sharing">
        <p>
          We do not sell your personal data to third parties. Your data may be shared only in these circumstances:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong className="text-[color:var(--mkt-text)]">Campaign members:</strong> Campaign content is shared
            with players you invite to your campaigns
          </li>
          <li>
            <strong className="text-[color:var(--mkt-text)]">AI processing:</strong> Campaign context sent to
            Anthropic when you use AI features
          </li>
          <li>
            <strong className="text-[color:var(--mkt-text)]">Payment processing:</strong> Billing data shared with
            our payment processor for credit purchases
          </li>
          <li>
            <strong className="text-[color:var(--mkt-text)]">Legal requirements:</strong> When required by law or to
            protect the rights and safety of our users
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="data-security" title="5. Data Security">
        <p>
          We implement industry-standard security measures including encrypted data transmission (HTTPS), secure
          password hashing (bcrypt), and access controls. While we strive to protect your data, no method of
          electronic transmission or storage is 100% secure.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. Data Retention and Deletion">
        <p>
          Your data is retained for as long as your account is active. You may request deletion of your account and
          associated data by contacting us. Upon deletion:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your account credentials are permanently deleted</li>
          <li>Campaign data where you are the sole DM is permanently deleted</li>
          <li>Your characters and personal content are permanently deleted</li>
          <li>Shared campaign data (chat messages, session notes) may be anonymized</li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies-storage" title="7. Cookies and Local Storage">
        <p>
          We use essential cookies for authentication (session tokens) and local storage for user preferences (sidebar
          state, theme settings, onboarding progress). We do not use tracking cookies or third-party analytics scripts.
        </p>
      </LegalSection>

      <LegalSection id="childrens-privacy" title="8. Children's Privacy">
        <p>
          The Platform is not directed at children under 13. We do not knowingly collect data from children under 13.
          AI features require age verification (18+) due to the nature of generated content.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="9. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your campaign data</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </LegalSection>

      <LegalSection id="policy-changes" title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. Material changes will be communicated via email or in-app
          notification. The "last updated" date at the top reflects the most recent revision.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>
          For privacy-related inquiries, please contact us at{' '}
          <a href="mailto:privacy@fablheim.com" className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            privacy@fablheim.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
