import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";

/**
 * Répond à la quatrième question du visiteur. N'affirme que ce qui est vrai
 * aujourd'hui : pas de badge, pas de certification non obtenue.
 *
 * LNAW-99 — frozen v4 (lna-v4-fr.html `.secb` / `.slist` / `.slinks`):
 * full-width Gray 10 · margin-top 96px · padding 64px 0 ·
 * heading c1-5 · list + legal links c7-16 ·
 * isolation / audit / delete icons · navy Privacy & Terms with arrows.
 */
const POINTS = [
  { key: "isolation", Icon: IsolationIcon },
  { key: "audit", Icon: AuditIcon },
  { key: "deletion", Icon: DeleteIcon },
] as const;

export function TrustSection() {
  const t = useTranslations("home.trust");
  const tFooter = useTranslations("footer");

  return (
    <Section
      data-trust-band
      className="bg-gray-10 mt-24 pt-16! pb-16! md:mt-24 md:pt-16! md:pb-16!"
    >
      <Container>
        <AnimateIn>
          <div className="grid grid-cols-1 items-start gap-8 min-[1056px]:grid-cols-[repeat(16,minmax(0,1fr))] min-[1056px]:gap-x-8">
            <h2 className="text-h2 text-foreground min-[1056px]:col-span-5">
              {t("heading")}
            </h2>
            <div className="min-w-0 min-[1056px]:col-span-10 min-[1056px]:col-start-7">
              <ul className="border-gray-30 border-b">
                {POINTS.map(({ key, Icon }) => (
                  <li
                    key={key}
                    className="border-gray-30 grid grid-cols-[40px_1fr] items-center gap-0 border-t py-5 text-base leading-[24px] min-[673px]:grid-cols-[48px_1fr] min-[673px]:text-lg min-[673px]:leading-[26px]"
                  >
                    <span className="text-primary inline-flex size-5 items-center justify-center">
                      <Icon />
                    </span>
                    <span className="text-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-8">
                <Link
                  href="/privacy"
                  className="text-primary inline-flex items-center gap-2 text-base hover:underline"
                >
                  {tFooter("privacyPolicy")}
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
                <Link
                  href="/terms"
                  className="text-primary inline-flex items-center gap-2 text-base hover:underline"
                >
                  {tFooter("termsOfService")}
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}

/** Frozen HTML isolation glyph (four squares). */
function IsolationIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M3 2h4v4H3zm1 1v2h2V3zm5-1h4v4H9zm1 1v2h2V3zM3 10h4v4H3zm1 1v2h2v-2zm5-1h4v4H9zm1 1v2h2v-2z" />
    </svg>
  );
}

/** Frozen HTML audit / log glyph. */
function AuditIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4 2h6l3 3v9H4zm1 1v10h7V5.4L9.6 3zM6 7h5v1H6zm0 2h5v1H6zm0 2h3v1H6z" />
    </svg>
  );
}

/** Frozen HTML delete / trash glyph. */
function DeleteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M6 6h1v6H6zm3 0h1v6H9zM2 3v1h1v10a1 1 0 001 1h8a1 1 0 001-1V4h1V3zm2 11V4h8v10zM6 1h4v1H6z" />
    </svg>
  );
}
