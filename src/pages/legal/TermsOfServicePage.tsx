import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background texture-parchment">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-2 font-['Cinzel_Decorative'] text-3xl font-bold text-foreground text-glow-gold">
          Terms of Service
        </h1>
        <p className="mb-8 text-muted-foreground font-['IM_Fell_English'] italic">
          Last updated: February 2026
        </p>

        <div className="space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Fablheim ("the Platform"), you agree to be bound by these Terms
              of Service. If you do not agree, you may not use the Platform.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Fablheim is a virtual tabletop platform for tabletop roleplaying games. The Platform
              provides tools for campaign management, character creation, live sessions, dice rolling,
              initiative tracking, battle maps, and AI-powered content generation.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <p>
              You must create an account to use the Platform. You are responsible for maintaining
              the confidentiality of your account credentials and for all activity that occurs under
              your account. You must provide accurate and complete information during registration.
            </p>
          </Section>

          <Section title="4. User Content">
            <p>
              You retain ownership of all content you create on the Platform, including but not
              limited to campaigns, characters, session notes, world-building entries, and uploaded
              images. By using the Platform, you grant Fablheim a limited license to store,
              display, and process your content solely for the purpose of providing the service.
            </p>
            <p>
              You are solely responsible for the content you create. You agree not to create content
              that is illegal, harmful, harassing, or violates the intellectual property rights of
              others.
            </p>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>
              The Platform uses Anthropic's Claude AI to power certain features. AI-generated content
              is dynamically produced and not reviewed by Fablheim staff. You understand that:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>AI features require age verification (18+)</li>
              <li>Generated content may contain mature themes common in tabletop RPGs</li>
              <li>AI content is for entertainment and should not replace official game rules</li>
              <li>Your campaign context is sent to Anthropic's API for processing</li>
              <li>You retain ownership of content created using AI features</li>
            </ul>
          </Section>

          <Section title="6. Credits and Payments">
            <p>
              AI features consume credits. Credits are available through subscription plans or
              one-time purchases:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Credits consumed upon use are non-refundable</li>
              <li>Subscription credits reset monthly and do not roll over</li>
              <li>Purchased credits expire after 90 days</li>
              <li>Fablheim reserves the right to modify credit costs with reasonable notice</li>
            </ul>
          </Section>

          <Section title="7. Open Game Content">
            <p>
              The Platform incorporates reference material from tabletop RPG systems under their
              respective open licenses (Creative Commons, ORC License, etc.). Fablheim does not
              claim ownership of third-party game content. See our{' '}
              <a href="/legal" className="text-primary hover:underline">
                Legal & Attributions
              </a>{' '}
              page for full details.
            </p>
          </Section>

          <Section title="8. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Use the Platform for any illegal purpose</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Interfere with the Platform's operation or security</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use automated tools to scrape or harvest data</li>
            </ul>
          </Section>

          <Section title="9. Termination">
            <p>
              Fablheim reserves the right to suspend or terminate accounts that violate these Terms
              or engage in abusive behavior. Upon termination, your right to use the Platform ceases
              immediately. You may request export of your data before account deletion.
            </p>
          </Section>

          <Section title="10. Disclaimers">
            <p>
              The Platform is provided "as is" without warranties of any kind. Fablheim does not
              guarantee uninterrupted availability or that the service will be error-free. We are not
              liable for any indirect, incidental, or consequential damages arising from your use of
              the Platform.
            </p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>
              Fablheim may update these Terms from time to time. Material changes will be communicated
              via email or in-app notification. Continued use of the Platform after changes constitutes
              acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@fablheim.com" className="text-primary hover:underline">
                legal@fablheim.com
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
