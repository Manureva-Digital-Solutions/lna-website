import type { Metadata } from "next";
import {
  Target,
  Eye,
  ShieldCheck,
  Lightbulb,
  Users,
  Sparkles,
  ArrowUpRight,
  BrainCircuit,
  LayoutTemplate,
  Building2,
  MapPinned,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { ThreeStepsVisuals } from "@/components/landing/visuals/ThreeStepsVisuals";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  const valueIcons = [ShieldCheck, Lightbulb, Users, Eye, Sparkles];
  const valueKeys = [
    "accuracyFirst",
    "aiPurpose",
    "customerCentric",
    "transparency",
    "innovation",
  ] as const;

  const teamIcons = [BrainCircuit, LayoutTemplate, Building2, MapPinned];
  const teamKeys = ["ai", "product", "enterprise", "delivery"] as const;

  return (
    <>
      {/* Hero */}
      <Section className="overflow-hidden pt-24 pb-8 md:pt-32 md:pb-12">
        <Container className="text-center">
          <AnimateIn>
            <h1 className="text-hero text-foreground text-balance">
              {t("hero.heading")}
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <p className="text-lead mx-auto mt-4 max-w-3xl text-pretty">
              {t("hero.description")}
            </p>
          </AnimateIn>
        </Container>
      </Section>

      {/* The Problem — LNAW-131: full-width section (copy + three-steps) */}
      <Section>
        <Container className="flex w-full flex-col gap-12">
          <AnimateIn className="w-full">
            <div className="w-full">
              <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                {t("problem.label")}
              </span>
              <h2 className="text-h2 text-foreground mt-3">
                {t("problem.heading")}
              </h2>
              <div className="text-body mt-6 w-full space-y-4">
                <p>{t("problem.p1")}</p>
                <p>{t("problem.p2")}</p>
                <p>{t("problem.p3")}</p>
                <p>{t("problem.p4")}</p>
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.15} className="w-full">
            <div className="min-h-[28rem] w-full min-[1056px]:min-h-[24rem]">
              <ThreeStepsVisuals
                staticComplete
                ariaLabel={t("problem.imageAlt")}
              />
            </div>
          </AnimateIn>
        </Container>
      </Section>

      {/* Mission & Vision */}
      <Section className="bg-gray-10 border-border border-t">
        <Container>
          <AnimateIn>
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">
              {t("missionVision.label")}
            </span>
          </AnimateIn>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <AnimateIn delay={0.1}>
              <div className="bg-card border-border rounded-none border p-8 shadow-none">
                <Target className="text-primary size-8" />
                <h3 className="text-tile text-foreground mt-4">
                  {t("missionVision.mission.title")}
                </h3>
                <p className="text-body mt-3">
                  {t("missionVision.mission.description")}
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.2}>
              <div className="bg-card border-border rounded-none border p-8 shadow-none">
                <Eye className="text-primary size-8" />
                <h3 className="text-tile text-foreground mt-4">
                  {t("missionVision.vision.title")}
                </h3>
                <p className="text-body mt-3">
                  {t("missionVision.vision.description")}
                </p>
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container>
          <AnimateIn>
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">
              {t("values.label")}
            </span>
            <h2 className="text-h2 text-foreground mt-3">
              {t("values.heading")}
            </h2>
          </AnimateIn>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {valueKeys.map((key, i) => {
              const Icon = valueIcons[i];
              return (
                <AnimateIn key={key} delay={0.1 * i}>
                  <div className="bg-card border-border rounded-none border p-6 shadow-none">
                    <Icon className="text-primary size-6" />
                    <h3 className="text-tile text-foreground mt-3">
                      {t(`values.${key}.title`)}
                    </h3>
                    <p className="text-body mt-2 text-sm">
                      {t(`values.${key}.description`)}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section className="bg-gray-10 border-border border-t">
        <Container>
          <AnimateIn>
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">
              {t("team.label")}
            </span>
            <h2 className="text-h2 text-foreground mt-3">
              {t("team.heading")}
            </h2>
            <p className="text-body mt-3 max-w-2xl">{t("team.description")}</p>
          </AnimateIn>
          <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamKeys.map((key, i) => {
              const Icon = teamIcons[i];
              return (
                <AnimateIn key={key} delay={0.1 * i} className="h-full">
                  <div className="bg-card border-border flex h-full min-h-[14rem] flex-col rounded-none border p-6 shadow-none">
                    <Icon
                      className="text-primary size-6 shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="text-tile text-foreground mt-3">
                      {t(`team.${key}.title`)}
                    </h3>
                    <p className="text-body mt-2 flex-1 text-sm">
                      {t(`team.${key}.description`)}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* The Company — Lemon Tree SAS */}
      <Section>
        <Container className="max-w-3xl">
          <AnimateIn>
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">
              {t("company.label")}
            </span>
            <h2 className="text-h2 text-foreground mt-3">
              {t("company.heading")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <div className="text-body mt-6 space-y-4">
              <p>{t("company.p1")}</p>
              <p>{t("company.p2")}</p>
              <p>{t("company.p3")}</p>
              <p>
                {t("company.p4")}{" "}
                <a
                  href="mailto:support@lnaflow.com"
                  className="text-primary hover:underline"
                >
                  support@lnaflow.com
                </a>
                .
              </p>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="bg-gray-10 border-border border-t">
        <Container className="text-center">
          <AnimateIn>
            <h2 className="text-h2 text-foreground">{t("cta.heading")}</h2>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <p className="text-body mx-auto mt-4 max-w-xl text-pretty">
              {t("cta.description")}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <LinkButton size="lg" href="/contact">
                {t("cta.ctaDemo")}
              </LinkButton>
              <LinkButton variant="outline" size="lg" href="/features">
                {t("cta.ctaFeatures")}
                <ArrowUpRight className="size-4" />
              </LinkButton>
            </div>
          </AnimateIn>
        </Container>
      </Section>
    </>
  );
}
