import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";

/**
 * LNAW-96 — frozen v4: three columns ≥1056, 1px Gray 20 top rule,
 * Plex Mono 01/02/03, 20px titles, Gray 70 body; stack below 1056.
 * LNAW-124 — step 3 is download (no review/confidence wording).
 */
const STEPS = ["template", "documents", "download"] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");
  return (
    <Section id="steps" className="pt-4 pb-4 md:pt-4 md:pb-4">
      <Container className="flex flex-col gap-9">
        <AnimateIn>
          <h2 className="text-h2 text-foreground min-[1056px]:whitespace-nowrap">
            {t("heading")}
          </h2>
        </AnimateIn>
        <ol className="grid grid-cols-1 gap-8 min-[1056px]:grid-cols-3 min-[1056px]:gap-12">
          {STEPS.map((step, i) => (
            <AnimateIn key={step} delay={i * 0.05}>
              <li className="border-gray-20 flex flex-col gap-2 border-t pt-4">
                <span className="text-muted-foreground font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-tile text-foreground">
                  {t(`${step}.label`)}
                </h3>
                <p className="text-body text-muted-foreground max-w-[46ch] text-pretty">
                  {t(`${step}.description`)}
                </p>
              </li>
            </AnimateIn>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
