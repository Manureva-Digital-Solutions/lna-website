import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { appUrls } from "@/lib/app-urls";

/**
 * Reprend le CTA du hero mot pour mot. La phrase dessous dit ce qui se passe
 * après le clic — pas un slogan.
 *
 * LNAW-92 — frozen v4 (lna-v4-fr.html `.final`):
 * white band · heading + body c1–8 · navy primary CTA c11–16 (align end) ·
 * stack below 1056 · same label/destination as hero (`appUrls.register`).
 *
 * Frozen `.btn`: min-height 48px, padding 13px 64px 13px 16px,
 * svg absolute right 16px (lna-v4-fr.html). Link semantics — not role="button".
 */
export function FinalCta() {
  const t = useTranslations("home.finalCta");
  return (
    <Section
      data-final-cta
      className="bg-background pt-16! pb-16! md:pt-20! md:pb-24!"
    >
      <Container>
        <div className="grid grid-cols-1 items-end gap-0 min-[1056px]:grid-cols-[repeat(16,minmax(0,1fr))] min-[1056px]:gap-x-8">
          <AnimateIn className="min-[1056px]:col-span-8">
            <h2 className="text-h2 text-foreground mb-4">{t("heading")}</h2>
            <p className="text-body text-muted-foreground mb-0 max-w-[560px] text-pretty">
              {t("reassurance")}
            </p>
          </AnimateIn>
          <AnimateIn
            delay={0.05}
            className="mt-8 flex justify-start min-[1056px]:col-span-6 min-[1056px]:col-start-11 min-[1056px]:mt-0"
          >
            <LinkButton
              size="lg"
              href={appUrls.register}
              data-icon="inline-end"
              className="h-12 w-full min-w-[220px] py-[13px] pr-16 pl-4 text-base leading-[22px] min-[672px]:w-auto"
            >
              {t("cta")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </AnimateIn>
        </div>
      </Container>
    </Section>
  );
}
