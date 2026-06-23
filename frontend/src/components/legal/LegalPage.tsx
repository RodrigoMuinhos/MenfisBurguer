import Link from "next/link";

const VERDE = "#1F3D2E";
const VINHO = "#7A0026";
const ROSA = "#F8B7CE";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-white" style={{ color: VERDE }}>
      <header className="border-b border-[#1F3D2E14] bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Voltar para Menfi's Burger">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full"
              style={{ border: `2px solid ${ROSA}`, background: "#fff" }}
            >
              <img src="/logo_M.jpeg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#1F3D2E99]">
                Menfi's Burger
              </span>
              <span className="block truncate text-sm font-black uppercase tracking-wide">
                Burger quente e entrega rapida
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{ background: VINHO, color: ROSA }}
          >
            Cardapio
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 py-10 md:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: `${VINHO}99` }}>
            {eyebrow}
          </p>
          <h1
            className="mt-4 uppercase"
            style={{
              color: VINHO,
              fontFamily: "var(--menfis-font-display)",
              fontSize: "clamp(3rem, 9vw, 6rem)",
              lineHeight: 0.9,
              letterSpacing: 0,
            }}
          >
            {title}
          </h1>
          <p className="mt-5 text-base leading-7 text-[#1F3D2ECC] md:text-lg">{description}</p>
          <p className="mt-4 text-sm font-bold text-[#1F3D2E99]">Ultima atualizacao: 11 de junho de 2026.</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[8px] border bg-white p-5 md:p-7"
              style={{ borderColor: `${ROSA}AA`, boxShadow: "0 14px 40px rgba(31,61,46,0.06)" }}
            >
              <h2 className="text-xl font-black uppercase tracking-wide" style={{ color: VINHO }}>
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-7 text-[#1F3D2ECC] md:text-base">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-[#1F3D2ECC] md:text-base">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: ROSA }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
