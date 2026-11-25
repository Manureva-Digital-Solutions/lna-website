import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import {
  UseCaseBeforeAfter,
  type UseCaseKey,
} from "@/components/landing/visuals/UseCaseBeforeAfter";

/**
 * Trois cas seulement : ce sont les trois verticales réellement implémentées.
 * Les factures fournisseurs sont classées « autre » par le produit — ne pas les ajouter.
 *
 * LNAW-98 — frozen v4 (lna-v4-fr.html `.cases` / `.case`):
 * Gray 10 tiles · 1 px Gray 20 gaps · Plex Mono 01/02/03 · 20 px titles ·
 * Gray 70 body · no arrows · 3 cols ≥1056 · stack below.
 * LNAW-127 — mini document → filled-rows visual per card (≤520px at 1440).
 */
const CASES = [
  "adp",
  "health",
  "condo",
] as const satisfies readonly UseCaseKey[];

export function UseCases() {
  const t = useTranslations("home.useCases");
  return (
    <Section className="pt-0! pb-0! md:pt-0! md:pb-0!">
      <Container>
        <AnimateIn>
          <h2 className="text-h2 text-foreground mb-8 md:mb-12">
            {t("heading")}
          </h2>
        </AnimateIn>
        <AnimateIn>
          <div
            data-use-cases
            className="border-gray-20 bg-gray-20 grid grid-cols-1 items-stretch gap-px border min-[1056px]:grid-cols-3"
          >
            {CASES.map((useCase, i) => (
              <article
                key={useCase}
                className="bg-gray-10 flex h-full min-h-0 flex-col px-4 pt-6 pb-8 max-[672px]:min-h-0 min-[1056px]:max-h-[520px] min-[1056px]:px-8 min-[1056px]:pb-10"
              >
                <span className="text-muted-foreground mb-3 block font-mono text-sm min-[1056px]:mb-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-tile text-foreground mb-2">
                  {t(`${useCase}.title`)}
                </h3>
                <p className="text-body text-muted-foreground min-h-[3.5rem]">
                  {t(`${useCase}.description`)}
                </p>
                <div className="mt-auto pt-1">
                  <UseCaseBeforeAfter useCase={useCase} />
                </div>
              </article>
            ))}
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}
