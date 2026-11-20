import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { HeroExcelWindow } from "@/components/landing/visuals/HeroExcelWindow";
import { appUrls } from "@/lib/app-urls";

/** Répond à la première question du visiteur : « ça remplit mon tableau ? » */
export function Hero() {
  const t = useTranslations("home.hero");
  const tSteps = useTranslations("home.howItWorks");

  return (
    <Section className="overflow-hidden pt-10 pb-12 md:pt-12 md:pb-16">
      <Container grid className="items-start gap-y-10">
        <div className="col-span-4 flex flex-col gap-5 min-[672px]:col-span-8 min-[1056px]:col-span-6">
          <AnimateIn>
            <h1 className="text-hero text-foreground min-[1056px]:max-w-[460px]">
              <span className="block">{t("heading")}</span>
              <span className="block">{t("headingHighlight")}</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.05}>
            <p className="text-body text-muted-foreground max-w-[42ch] text-pretty">
              {t("description")}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <div className="flex w-full flex-col items-stretch gap-2 min-[672px]:items-start">
              <LinkButton
                size="lg"
                href={appUrls.register}
                data-icon="inline-end"
                className="relative w-full justify-start gap-0 py-[13px] pr-16 pl-4 text-base leading-[22px] min-[672px]:w-auto"
              >
                {t("ctaPrimary")}
                <ArrowRight
                  className="absolute top-1/2 right-4 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
              </LinkButton>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<a href="#steps" />}
                className="text-primary h-auto justify-start gap-2 border-0 px-0 py-1 font-normal shadow-none hover:bg-transparent min-[672px]:ml-3"
              >
                {tSteps("heading")}
                <ArrowDown className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-muted-foreground mt-3 text-sm">
                {t("ctaNote")}
              </p>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn
          delay={0.15}
          className="col-span-4 w-full min-w-0 min-[672px]:col-span-8 min-[1056px]:col-span-10"
        >
          <div className="bg-gray-10 w-full rounded-none p-3 sm:p-4 md:p-5">
            <HeroExcelWindow />
            <p className="text-muted-foreground mt-3 text-[11px] leading-4">
              {t("visual.provenance")}
            </p>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}
