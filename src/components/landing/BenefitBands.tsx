import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { BeforeAfterExcel } from "@/components/landing/visuals/BeforeAfterExcel";
import { RoleClassification } from "@/components/landing/visuals/RoleClassification";
import { FilledComparisonSheet } from "@/components/landing/visuals/FilledComparisonSheet";
import { ExportGate } from "@/components/landing/visuals/ExportGate";
import { appUrls } from "@/lib/app-urls";

/**
 * LNAW-97 — frozen v4 from lna-v4-fr.html:
 * tiles2 → split (c1-5 | c6-16 stage) → split.rev (c1-10 stage | c11-16).
 */
function FeatureTile({
  heading,
  body,
  visual,
}: {
  heading: string;
  body: string;
  visual: ReactNode;
}) {
  return (
    <article className="bg-gray-10 flex h-full min-w-0 flex-col overflow-hidden rounded-none shadow-none">
      {/* .tile .vis — 32px sides/top, height 330 */}
      <div className="flex items-center px-4 pt-4 max-[672px]:h-auto md:h-[330px] md:px-8 md:pt-8">
        <div className="w-full min-w-0 overflow-x-auto">{visual}</div>
      </div>
      {/* .tile .txt — 32px */}
      <div className="flex min-w-0 flex-col px-4 pt-6 pb-8 md:p-8">
        <h3 className="text-tile text-foreground mb-3">{heading}</h3>
        <p className="text-body text-muted-foreground max-w-[560px]">{body}</p>
      </div>
    </article>
  );
}

export function BenefitBands() {
  const t = useTranslations("home.bands");
  const tHero = useTranslations("home.hero");

  return (
    <Section className="pt-16 pb-16 md:pt-24 md:pb-24">
      <Container>
        <AnimateIn>
          {/* .h2 .sect-h — 42/50 · mb 48 */}
          <h2 className="text-h2 text-foreground mb-8 md:mb-12">
            {t("heading")}
          </h2>
        </AnimateIn>

        <AnimateIn>
          <div className="border-gray-20 bg-gray-20 grid grid-cols-1 gap-px border min-[1056px]:grid-cols-2 min-[1056px]:items-stretch">
            <FeatureTile
              heading={t("template.heading")}
              body={t("template.body")}
              visual={<BeforeAfterExcel />}
            />
            <FeatureTile
              heading={t("mixed.heading")}
              body={t("mixed.body")}
              visual={<RoleClassification />}
            />
          </div>
        </AnimateIn>

        {/* .split — mt 96 · c1-5 text | c6-16 .stage */}
        <AnimateIn>
          <div className="mt-16 grid min-w-0 grid-cols-1 items-start gap-8 min-[1056px]:mt-24 min-[1056px]:grid-cols-[repeat(16,minmax(0,1fr))] min-[1056px]:gap-x-8">
            <div className="flex min-w-0 flex-col min-[1056px]:col-span-5">
              <h3 className="text-h3 text-foreground mb-4">
                {t("fields.heading")}
              </h3>
              <p className="text-body text-muted-foreground mb-4 max-w-[480px] max-[671px]:mb-3 min-[1056px]:mb-8">
                {t("fields.body")}
              </p>
              <Link
                href={appUrls.register}
                className="text-primary inline-flex w-fit items-center gap-2 text-base hover:underline"
              >
                {tHero("ctaPrimary")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="bg-gray-10 min-w-0 p-4 max-[1056px]:mt-4 max-[672px]:-mx-4 max-[671px]:mt-3 min-[1056px]:col-span-11 min-[1056px]:mt-0 min-[1313px]:p-12 md:p-8">
              <FilledComparisonSheet />
            </div>
          </div>
        </AnimateIn>

        {/* .split.rev — mt 96 · c1-10 .stage | c11-16 text on white */}
        <AnimateIn>
          <div className="mt-16 grid min-w-0 grid-cols-1 items-start gap-8 min-[1056px]:mt-24 min-[1056px]:grid-cols-[repeat(16,minmax(0,1fr))] min-[1056px]:gap-x-8">
            <div className="bg-gray-10 order-2 flex min-w-0 items-start p-4 max-[1056px]:mt-8 max-[672px]:-mx-4 min-[1056px]:order-none min-[1056px]:col-span-10 min-[1313px]:p-12 md:p-8">
              <ExportGate />
            </div>
            <div className="order-1 flex min-w-0 flex-col min-[1056px]:order-none min-[1056px]:col-span-6">
              <h3 className="text-h3 text-foreground mb-4">
                {t("validation.heading")}
              </h3>
              <p className="text-body text-muted-foreground max-w-[480px]">
                {t("validation.body")}
              </p>
            </div>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}
