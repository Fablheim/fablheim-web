import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background texture-parchment">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-2 font-['Cinzel_Decorative'] text-3xl font-bold text-foreground text-glow-gold">
          Privacy Policy
        </h1>
        <p className="mb-8 text-muted-foreground font-['IM_Fell_English'] italic">
          Last updated: February 2026
        </p>

        <div className="space-y-8">
          <Section title="1. Information We Collect">
            <h3 className="font-semibold text-foreground mb-1">Account Information</h3>
            <p>
              When you create an account, we collect your email address, username, and display name.
              Passwords are stored using bcrypt hashing and are never stored in plain text.
            </p>
            <h3 className="mt-3 font-semibold text-foreground mb-1">Campaign Data</h3>
            <p>
              We store content you create on the Platform: campaigns, characters, session notes,
              world-building entries, dice roll history, chat messages, and uploaded images. This
              data is necessary to provide the service.
            </p>
            <h3 className="mt-3 font-semibold text-foreground mb-1">Usage Data</h3>
            <p>
              We collect basic usage analytics including page views, feature usage, AI credit
              consumption, and session duration. This data is used to improve the Platform.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process transactions and manage subscriptions</li>
              <li>Send service-related notifications (password resets, billing alerts)</li>
              <li>Generate AI-powered content at your request</li>
              <li>Respond to support inquiries</li>
            </ul>
          </Section>

          <Section title="3. AI Data Processing">
            <p>
              When you use AI-powered features, your campaign context (session notes, character
              details, world entities) is sent to Anthropic's API for processing. Important points:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Data sent to Anthropic is not used to train AI models</li>
              <li>AI processing occurs in real-time and is not stored by Anthropic</li>
              <li>You can use all non-AI features without any data being sent to third parties</li>
              <li>
                Refer to{' '}
                <a
                  href="https://www.anthropic.com/policies/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic's privacy policy
                </a>{' '}
                for details on their data handling
              </li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              We do not sell your personal data to third parties. Your data may be shared only in
              these circumstances:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong className="text-foreground">Campaign members:</strong> Campaign content
                is shared with players you invite to your campaigns
              </li>
              <li>
                <strong className="text-foreground">AI processing:</strong> Campaign context sent
                to Anthropic when you use AI features
              </li>
              <li>
                <strong className="text-foreground">Payment processing:</strong> Billing data
                shared with our payment processor for credit purchases
              </li>
              <li>
                <strong className="text-foreground">Legal requirements:</strong> When required by
                law or to protect the rights and safety of our users
              </li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p>
              We implement industry-standard security measures including encrypted data transmission
              (HTTPS), secure password hashing (bcrypt), and access controls. While we strive to
              protect your data, no method of electronic transmission or storage is 100% secure.
            </p>
          </Section>

          <Section title="6. Data Retention and Deletion">
            <p>
              Your data is retained for as long as your account is active. You may request deletion
              of your account and associated data by contacting us. Upon deletion:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Your account credentials are permanently deleted</li>
              <li>Campaign data where you are the sole DM is permanently deleted</li>
              <li>Your characters and personal content are permanently deleted</li>
              <li>Shared campaign data (chat messages, session notes) may be anonymized</li>
            </ul>
          </Section>

          <Section title="7. Cookies and Local Storage">
            <p>
              We use essential cookies for authentication (session tokens) and local storage for
              user preferences (sidebar state, theme settings, onboarding progress). We do not use
              tracking cookies or third-party analytics scripts.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              The Platform is not directed at children under 13. We do not knowingly collect data
              from children under 13. AI features require age verification (18+) due to the nature
              of generated content.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your campaign data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated
              via email or in-app notification. The "last updated" date at the top reflects the most
              recent revision.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related inquiries, please contact us at{' '}
              <a href="mailto:privacy@fablheim.com" className="text-primary hover:underline">
                privacy@fablheim.com
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/60 p-6">
      <h2 className="mb-4 font-['IM_Fell_English'] text-xl font-bold text-primary">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
