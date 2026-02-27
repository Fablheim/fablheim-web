import { LegalCallout, LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

const toc = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'service-description', label: '2. Description of Service' },
  { id: 'account-registration', label: '3. Account Registration' },
  { id: 'user-content', label: '4. User Content' },
  { id: 'ai-content', label: '5. AI-Generated Content' },
  { id: 'credits-payments', label: '6. Credits and Payments' },
  { id: 'open-game-content', label: '7. Open Game Content' },
  { id: 'prohibited-conduct', label: '8. Prohibited Conduct' },
  { id: 'termination', label: '9. Termination' },
  { id: 'disclaimers', label: '10. Disclaimers' },
  { id: 'changes', label: '11. Changes to Terms' },
  { id: 'contact', label: '12. Contact' },
];

export function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="February 2026"
      intro="These terms govern access to and use of the Fablheim platform."
      toc={toc}
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By accessing or using Fablheim ("the Platform"), you agree to be bound by these Terms of Service. If you do
          not agree, you may not use the Platform.
        </p>
      </LegalSection>

      <LegalSection id="service-description" title="2. Description of Service">
        <p>
          Fablheim is a virtual tabletop platform for tabletop roleplaying games. The Platform provides tools for
          campaign management, character creation, live sessions, dice rolling, initiative tracking, battle maps, and
          AI-powered content generation.
        </p>
      </LegalSection>

      <LegalSection id="account-registration" title="3. Account Registration">
        <p>
          You must create an account to use the Platform. You are responsible for maintaining the confidentiality of
          your account credentials and for all activity that occurs under your account. You must provide accurate and
          complete information during registration.
        </p>
      </LegalSection>

      <LegalSection id="user-content" title="4. User Content">
        <p>
          You retain ownership of all content you create on the Platform, including but not limited to campaigns,
          characters, session notes, world-building entries, and uploaded images. By using the Platform, you grant
          Fablheim a limited license to store, display, and process your content solely for the purpose of providing
          the service.
        </p>
        <p>
          You are solely responsible for the content you create. You agree not to create content that is illegal,
          harmful, harassing, or violates the intellectual property rights of others.
        </p>
      </LegalSection>

      <LegalSection id="ai-content" title="5. AI-Generated Content">
        <p>
          The Platform uses Anthropic's Claude AI to power certain features. AI-generated content is dynamically
          produced and not reviewed by Fablheim staff. You understand that:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>AI features require age verification (18+)</li>
          <li>Generated content may contain mature themes common in tabletop RPGs</li>
          <li>AI content is for entertainment and should not replace official game rules</li>
          <li>Your campaign context is sent to Anthropic's API for processing</li>
          <li>You retain ownership of content created using AI features</li>
        </ul>
        <LegalCallout>
          AI assists gameplay preparation and continuity, but does not replace GM judgment.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="credits-payments" title="6. Credits and Payments">
        <p>AI features consume credits. Credits are available through subscription plans or one-time purchases:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Credits consumed upon use are non-refundable</li>
          <li>Subscription credits reset monthly and do not roll over</li>
          <li>Purchased credits expire after 90 days</li>
          <li>Fablheim reserves the right to modify credit costs with reasonable notice</li>
        </ul>
      </LegalSection>

      <LegalSection id="open-game-content" title="7. Open Game Content">
        <p>
          The Platform incorporates reference material from tabletop RPG systems under their respective open licenses
          (Creative Commons, ORC License, etc.). Fablheim does not claim ownership of third-party game content. See
          our{' '}
          <a href="/legal" className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            Legal & Attributions
          </a>{' '}
          page for full details.
        </p>
      </LegalSection>

      <LegalSection id="prohibited-conduct" title="8. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Attempt to gain unauthorized access to other accounts or systems</li>
          <li>Use the Platform for any illegal purpose</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Interfere with the Platform's operation or security</li>
          <li>Reverse engineer or attempt to extract source code</li>
          <li>Use automated tools to scrape or harvest data</li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" title="9. Termination">
        <p>
          Fablheim reserves the right to suspend or terminate accounts that violate these Terms or engage in abusive
          behavior. Upon termination, your right to use the Platform ceases immediately. You may request export of your
          data before account deletion.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="10. Disclaimers">
        <p>
          The Platform is provided "as is" without warranties of any kind. Fablheim does not guarantee uninterrupted
          availability or that the service will be error-free. We are not liable for any indirect, incidental, or
          consequential damages arising from your use of the Platform.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to Terms">
        <p>
          Fablheim may update these Terms from time to time. Material changes will be communicated via email or in-app
          notification. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact">
        <p>
          For questions about these Terms, please contact us at{' '}
          <a href="mailto:legal@fablheim.com" className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            legal@fablheim.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
