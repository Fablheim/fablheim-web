import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/60 p-6">
      <h2 className="mb-4 font-['IM_Fell_English'] text-xl font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}

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
    <div className="rounded-md border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <a
          href={licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {license} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background texture-parchment">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-2 font-['Cinzel_Decorative'] text-3xl font-bold text-foreground text-glow-gold">
          Legal & Attributions
        </h1>
        <p className="mb-8 text-muted-foreground font-['IM_Fell_English'] italic">
          Licenses, acknowledgments, and policies governing the Fablheim platform.
        </p>

        <div className="space-y-6">
          {/* SRD Attributions */}
          <Section title="Open Game Content & SRD Attributions">
            <p className="mb-4 text-sm text-muted-foreground">
              Fablheim incorporates reference material from several tabletop roleplaying game systems
              under their respective open licenses. We do not claim ownership of any third-party game
              content. All referenced rules, mechanics, and terminology remain the property of their
              respective publishers.
            </p>

            <div className="space-y-3">
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
          </Section>

          {/* AI Content */}
          <Section title="AI-Generated Content">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Fablheim uses Anthropic's Claude AI to power certain features including NPC generation,
                session summaries, encounter building, and world building tools. AI-generated content
                is produced dynamically and is not reviewed or curated by Fablheim staff.
              </p>
              <p>
                AI features require age verification (18+) as generated content may include mature themes,
                combat descriptions, horror elements, or morally complex scenarios common in tabletop
                roleplaying games.
              </p>
              <p>
                AI-generated content is provided for entertainment and gameplay assistance. It should not
                be relied upon as a substitute for official game rules. Users retain ownership of content
                created using AI features within their campaigns.
              </p>
            </div>
          </Section>

          {/* Privacy */}
          <Section title="Privacy">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Fablheim collects only the information necessary to provide our services: your account
                credentials (email, hashed password), campaign data you create, and basic usage analytics.
              </p>
              <p>
                We do not sell your personal data to third parties. Campaign content, character sheets,
                and session notes are private to you and your campaign members.
              </p>
              <p>
                When you use AI features, your campaign context (session notes, character details, world
                entities) is sent to Anthropic's API for processing. This data is not used to train AI
                models. Refer to{' '}
                <a
                  href="https://www.anthropic.com/policies/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic's privacy policy
                </a>{' '}
                for details on their data handling practices.
              </p>
            </div>
          </Section>

          {/* Terms */}
          <Section title="Terms of Service">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                By using Fablheim, you agree to use the platform in accordance with applicable laws and
                the terms of the open licenses governing game content.
              </p>
              <p>
                You are responsible for the content you create within your campaigns. Fablheim is not
                responsible for user-generated content or AI-generated content that users choose to
                incorporate into their games.
              </p>
              <p>
                AI credits are consumed upon use and are non-refundable. Subscription credits reset
                monthly. Purchased credits expire after 90 days. Fablheim reserves the right to modify
                credit costs and subscription terms with reasonable notice.
              </p>
              <p>
                Fablheim reserves the right to suspend or terminate accounts that violate these terms
                or that engage in abusive behavior toward other users or the platform.
              </p>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact">
            <p className="text-sm text-muted-foreground">
              For questions about these policies, licensing, or to report concerns, please reach out at{' '}
              <a href="mailto:legal@fablheim.com" className="text-primary hover:underline">
                legal@fablheim.com
              </a>
              .
            </p>
          </Section>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Last updated: February 2026
        </p>
      </div>
    </div>
  );
}
