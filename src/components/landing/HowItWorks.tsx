import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { ThreeStepsVisuals } from "@/components/landing/visuals/ThreeStepsVisuals";

/**
 * LNAW-96 — frozen v4 shell: H2 + three steps.
 * LNAW-124 — step 3 is download (no review/confidence wording).
 * LNAW-123 — animated product visuals per step (template → docs → download).
 */
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
        <AnimateIn delay={0.05}>
          <ThreeStepsVisuals />
        </AnimateIn>
      </Container>
    </Section>
  );
}
