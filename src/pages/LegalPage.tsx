import { ExternalLink } from 'lucide-react';
import { LegalCallout, LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

function Attribution({
  name,
  license,
  licenseUrl,
  description,
}: {
  name: string;
  license: string;
  licenseUrl: string;
  description: string;
}) {
  return (
    <article className="mkt-card rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{name}</h3>
        <a
          href={licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.1em] text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/40 hover:decoration-[color:var(--mkt-accent)]"
        >
          {license}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--mkt-muted)]">{description}</p>
    </article>
  );
}

const toc = [
  { id: 'attributions', label: 'Open Game Content & Attributions' },
  { id: 'ai-content', label: 'AI-Generated Content' },
  { id: 'privacy-summary', label: 'Privacy Summary' },
  { id: 'terms-summary', label: 'Terms Summary' },
  { id: 'contact', label: 'Contact' },
];

export function LegalPage() {
  return (
    <LegalPageLayout
      title="Legal & Attributions"
      lastUpdated="February 2026"
      intro="Licenses, acknowledgments, and policy summaries governing the Fablheim platform."
      toc={toc}
    >
      <LegalSection id="attributions" title="Open Game Content & Attributions">
        <p>
          Fablheim incorporates reference material from several tabletop roleplaying game systems under their
          respective open licenses. We do not claim ownership of third-party game content. Refer to the source licenses
          below.
        </p>

        <div className="mt-4 grid gap-3">
          <Attribution
            name="D&D 5th Edition SRD 5.1"
            license="CC BY 4.0"
            licenseUrl="https://creativecommons.org/licenses/by/4.0/"
            description="The Systems Reference Document 5.1 is provided by Wizards of the Coast under the Creative Commons Attribution 4.0 International License. Dungeons & Dragons, D&D, and related trademarks are property of Wizards of the Coast LLC."
          />
          <Attribution
            name="Pathfinder 2e (Remaster)"
            license="ORC License"
            licenseUrl="https://paizo.com/community/blog/v5748dyo6si7v"
            description="Pathfinder rules content is used under the ORC (Open RPG Creative) License. Pathfinder is a trademark of Paizo Inc. This product is not published, endorsed, or specifically approved by Paizo."
          />
          <Attribution
            name="Fate Core & Fate Accelerated"
            license="CC BY 3.0"
            licenseUrl="https://creativecommons.org/licenses/by/3.0/"
            description="Fate Core and Fate Accelerated are products of Evil Hat Productions, LLC, and are used under the Creative Commons Attribution 3.0 Unported License. The Fate Core font is also licensed under CC BY 3.0."
          />
          <Attribution
            name="Daggerheart"
            license="DPCGL"
            licenseUrl="https://www.daggerheart.com"
            description="Daggerheart content is used under the Daggerheart Players Community Gaming License (DPCGL) provided by Darrington Press. Daggerheart is a trademark of Darrington Press LLC."
          />
        </div>
      </LegalSection>

      <LegalSection id="ai-content" title="AI-Generated Content">
        <p>
          Fablheim uses Anthropic's Claude AI to power selected features including NPC generation, encounter building,
          world-building tools, and session summaries. AI-generated content is dynamic and not manually reviewed by
          Fablheim staff.
        </p>
        <p>
          AI features require age verification (18+) as generated content may include mature themes common in tabletop
          roleplaying settings. AI output is provided for gameplay assistance and should not replace official rules
          references.
        </p>
        <p>
          Users retain ownership of content created using AI features within their campaigns.
        </p>
      </LegalSection>

      <LegalSection id="privacy-summary" title="Privacy Summary">
        <p>
          Fablheim collects information required to operate the service, including account details, campaign data, and
          limited usage analytics. We do not sell personal data to third parties.
        </p>
        <p>
          When AI features are used, relevant campaign context is sent to Anthropic's API for processing and is not
          used to train AI models. See{' '}
          <a
            href="https://www.anthropic.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]"
          >
            Anthropic's privacy policy
          </a>{' '}
          for details.
        </p>
      </LegalSection>

      <LegalSection id="terms-summary" title="Terms Summary">
        <p>
          By using Fablheim, you agree to comply with applicable law and the relevant open licenses governing game
          content. You remain responsible for user-generated campaign content.
        </p>
        <p>
          AI credits are consumed upon use and are non-refundable. Subscription credits reset monthly. Purchased
          credits expire after 90 days. Fablheim may update credit costs and subscription terms with reasonable notice.
        </p>
        <p>
          Fablheim reserves the right to suspend or terminate accounts that violate these terms or engage in abusive
          conduct toward other users or the platform.
        </p>
        <LegalCallout>
          For full legal language, review the dedicated{' '}
          <a href="/legal/terms" className="underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/legal/privacy" className="underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            Privacy Policy
          </a>{' '}
          pages.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          For legal, licensing, or policy questions, contact{' '}
          <a href="mailto:legal@fablheim.com" className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/45 hover:decoration-[color:var(--mkt-accent)]">
            legal@fablheim.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
