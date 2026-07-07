import type { Metadata } from "next";
import {
  ArrowRight,
  BeerOff,
  CakeSlice,
  Check,
  CupSoda,
  Gift,
  Martini,
  MessageCircle,
  Pizza,
  Sandwich,
  Sparkles,
  Utensils,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Menfis Buffet | Mini burgers, salgados, doces e bebidas para festas",
  description:
    "Menfis Buffet para aniversarios, eventos corporativos e celebracoes com mini hamburgueres artesanais, salgados, mini pizzas, doces, bebidas e drinks sem alcool.",
};

const VERDE = "#314A37";
const ROSA = "#F8B7C8";
const CREME = "#FFF8F2";
const TOMATE = "#C2410C";
const WHATSAPP = "https://wa.me/5585997883764";
const WHATSAPP_TEXT = encodeURIComponent(
  "Olá! Quero levar o Menfi's Buffet para minha festa. Pode me ajudar a montar um orçamento personalizado?",
);

const heroImage = "/menfisbuffet-static/assets/image-6-5SjDxcF7.png";
const burgerImage = "/menfisbuffet-static/assets/image-4-XDcwhyYc.png";
const miniEventImage = "/menfisbuffet-static/assets/image-5-COuJdcpv.png";
const logoImage = "/menfisbuffet-static/assets/logonome-D-L_tmq8.jpeg";

const miniBurgers = [
  ["Mini Menfi's Burger", "Blend bovino, cheddar e molho Menfi's."],
  ["Mini Chicken", "Frango crocante, cheddar e molho especial."],
  ["Mini Bacon", "Blend bovino, cheddar, bacon e molho Menfi's."],
  ["Mini Kids Burger", "Versao infantil mais simples, com queijo e molho suave."],
];

const salgados = [
  ["Coxinha de frango", "Classica, cremosa e crocante."],
  ["Bolinha de queijo", "Massa leve com recheio de queijo."],
  ["Risole de presunto e queijo", "Tradicional para festas."],
  ["Kibe", "Temperado, crocante e bem sequinho."],
];

const pizzas = [
  ["Mini Pizza Marguerita", "Molho de tomate, queijo, tomate e manjericao."],
  ["Mini Pizza Italiana", "Calabresa italiana com queijo e oregano."],
  ["Quatro queijos", "Opcao mais premium para montar pacotes maiores."],
  ["Frango com catupiry", "Mais brasileiro, familiar e facil de agradar."],
];

const classicSweets = [
  ["Brigadeiro tradicional", "Chocolate classico."],
  ["Beijinho", "Coco com leite condensado."],
  ["Cajuzinho", "Amendoim tradicional."],
  ["Casadinho", "Brigadeiro branco com chocolate."],
];

const specialSweets = [
  ["Brigadeiro de pistache", "Opcao premium."],
  ["Brigadeiro de Oreo", "Mais infantil e moderno."],
  ["Ninho com Nutella", "Muito forte para festas."],
  ["Brownie bite", "Mini brownie em pedacos individuais."],
];

const drinks = [
  ["Suco natural", "Laranja, acerola, maracuja ou caja."],
  ["Agua mineral", "Com e sem gas."],
  ["Refrigerante", "Coca-Cola, Guarana e opcoes zero."],
  ["Cha gelado", "Limao ou pessego."],
  ["Agua saborizada", "Limao, hortela e frutas."],
];

const mocktails = [
  ["Pink Lemonade Menfi's", "Limao, frutas vermelhas e gelo."],
  ["Mojito sem alcool", "Limao, hortela, agua com gas e acucar."],
  ["Soda italiana", "Xarope de fruta, gelo e agua com gas."],
  ["Tropical Kids", "Suco de laranja, abacaxi e gelo."],
  ["Menfi's Fresh", "Limao, hortela e agua gaseificada."],
];

const packages = [
  {
    name: "Combo Mini Festa",
    ideal: "Aniversarios pequenos e reunioes familiares",
    items: [
      "Mini hamburgueres Menfi's",
      "Salgadinhos classicos",
      "Mini pizzas",
      "Docinhos classicos",
      "Bebidas infantis",
    ],
  },
  {
    name: "Combo Festa Premium",
    ideal: "Aniversarios maiores, eventos corporativos e saloes",
    featured: true,
    items: [
      "Mini hamburgueres variados",
      "4 salgadinhos classicos",
      "2 sabores de mini pizza",
      "4 docinhos classicos",
      "4 docinhos especiais",
      "Praca de bebidas infantis",
      "Drinks sem alcool",
      "Montagem de mesa Menfi's",
    ],
  },
  {
    name: "Combo Evento Completo",
    ideal: "Casamentos, festas adultas e confraternizacoes",
    items: [
      "Estacao de mini burgers",
      "Salgados classicos",
      "Mini pizzas artesanais",
      "Doces classicos e especiais",
      "Praca de bebidas",
      "Drinks sem alcool",
      "Equipe de apoio",
      "Montagem visual personalizada",
      "Embalagens e identidade Menfi's",
    ],
  },
];

const gallery = [
  "/menfisbuffet-static/assets/image-1-3BC4Og4k.png",
  "/menfisbuffet-static/assets/image-4-XDcwhyYc.png",
  "/menfisbuffet-static/assets/image-5-COuJdcpv.png",
  "/menfisbuffet-static/assets/image-6-5SjDxcF7.png",
  "/menfisbuffet-static/assets/image-7-INGNXHjL.png",
  "/menfisbuffet-static/assets/image-8-6OiReUZY.png",
];

export default function MenfisBuffetPage() {
  return (
    <main className="min-h-screen bg-white text-[#314A37]">
      <header className="sticky top-0 z-40 border-b border-[#314A37]/10 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a href="#inicio" className="flex items-center gap-3">
            <img src={logoImage} alt="Menfi's Buffet" className="h-11 w-11 rounded-full object-cover" />
            <span className="text-sm font-black uppercase tracking-[0.18em]">Menfi's Buffet</span>
          </a>
          <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-wide lg:flex">
            <a href="#cardapio">Cardapio</a>
            <a href="#bebidas">Bebidas</a>
            <a href="#pacotes">Pacotes</a>
            <a href="#galeria">Galeria</a>
          </nav>
          <a
            href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-black uppercase text-white"
            style={{ background: VERDE }}
          >
            Orçamento
            <MessageCircle size={15} />
          </a>
        </div>
      </header>

      <section id="inicio" className="relative min-h-[92dvh] overflow-hidden">
        <img src={heroImage} alt="Mesa de mini burgers Menfi's Buffet" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
        <div className="relative mx-auto flex min-h-[92dvh] max-w-7xl flex-col justify-end px-4 pb-8 pt-28 md:px-6 lg:pb-12">
          <div className="max-w-3xl text-white">
            <p className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em]" style={{ background: ROSA, color: VERDE }}>
              Mini burgers artesanais para eventos
            </p>
            <h1 className="text-5xl font-black leading-none sm:text-6xl lg:text-7xl">Menfi's Buffet</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/88 sm:text-lg">
              Levamos a experiencia do hambúrguer artesanal Menfi's para festas, aniversarios, eventos corporativos e celebracoes especiais.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-black uppercase"
                style={{ background: ROSA, color: VERDE }}
              >
                Solicite seu orçamento
                <ArrowRight size={18} />
              </a>
              <a
                href="#cardapio"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/35 px-7 text-sm font-black uppercase text-white"
              >
                Ver cardapio
              </a>
            </div>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
            {["Mini burgers", "Salgados + pizzas", "Doces + bebidas"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/20 bg-white/12 p-4 text-sm font-black uppercase tracking-wide text-white backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 lg:py-20" style={{ background: CREME }}>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Experiencia completa</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Mais completo para festas maiores, sem perder a alma Menfi's.</h2>
          </div>
          <p className="text-base font-semibold leading-relaxed text-[#314A37]/72">
            Nosso cardapio conta com mini hamburgueres artesanais, salgadinhos classicos, mini pizzas, docinhos especiais, praca de bebidas infantis e drinks sem alcool. Montamos uma experiencia completa, visual e saborosa para deixar seu evento mais pratico, bonito e inesquecivel.
          </p>
        </div>
      </section>

      <section id="cardapio" className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Cardapio Menfi's Buffet"
            title="Mini hamburguer como protagonista, com complementos para evento completo."
            copy="A ordem do menu foi pensada para vender melhor: mini burgers, salgadinhos, mini pizzas, doces, bebidas, mocktails e pacotes."
          />

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <MenuBlock icon={<Sandwich size={22} />} title="Mini Hamburgueres Menfi's" items={miniBurgers} highlight />
            <PhotoPanel image={burgerImage} title="Principal da casa" copy="Mini brioche, blend artesanal, cheddar, molho Menfi's e finalizacao da casa." />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <MenuBlock icon={<Utensils size={22} />} title="Salgadinhos classicos" items={salgados} note="Entram como complemento dos combos ou mesa de apoio para festas maiores." />
            <MenuBlock icon={<Pizza size={22} />} title="Mini pizzas" items={pizzas} note="Sugestao inicial: trabalhar com Marguerita e Calabresa Italiana primeiro." />
            <PhotoPanel image={miniEventImage} title="Montagem de festa" copy="Mesa com variedade e presenca visual para convidados perceberem valor no pacote." compact />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <MenuBlock icon={<CakeSlice size={22} />} title="4 docinhos classicos" items={classicSweets} />
            <MenuBlock icon={<Sparkles size={22} />} title="4 docinhos especiais Menfi's" items={specialSweets} note="A combinacao de classicos + especiais aumenta a percepcao de variedade e valor." />
          </div>
        </div>
      </section>

      <section id="bebidas" className="px-4 py-14 md:px-6 lg:py-20" style={{ background: CREME }}>
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Praca de bebidas"
            title="Bebidas infantis e drinks sem alcool para deixar o buffet mais premium."
            copy='Para festas infantis, use "drinks sem alcool" ou "mocktails infantis": fica bonito e evita confusao.'
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <MenuBlock icon={<CupSoda size={22} />} title="Bebidas infantis" items={drinks} />
            <MenuBlock icon={<Martini size={22} />} title="Drinks sem alcool" items={mocktails} dark />
          </div>
        </div>
      </section>

      <section id="pacotes" className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Pacotes para festas"
            title="Modelos prontos para vender de eventos pequenos a festas completas."
            copy="Cada pacote pode ser ajustado por quantidade de convidados, sabores e nivel de montagem visual."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {packages.map((pack) => (
              <article
                key={pack.name}
                className="flex min-h-full flex-col rounded-3xl p-6"
                style={{
                  background: pack.featured ? VERDE : "#fff",
                  color: pack.featured ? "#fff" : VERDE,
                  border: `1.5px solid ${pack.featured ? VERDE : `${VERDE}18`}`,
                  boxShadow: pack.featured ? "0 26px 60px rgba(49,74,55,0.28)" : "none",
                }}
              >
                {pack.featured && (
                  <span className="mb-4 w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ background: ROSA, color: VERDE }}>
                    Mais completo para vender
                  </span>
                )}
                <Gift size={24} color={pack.featured ? ROSA : TOMATE} />
                <h3 className="mt-4 text-2xl font-black">{pack.name}</h3>
                <p className={`mt-2 text-sm font-semibold leading-relaxed ${pack.featured ? "text-white/72" : "text-[#314A37]/62"}`}>{pack.ideal}</p>
                <ul className="mt-6 grid gap-3">
                  {pack.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm font-bold">
                      <Check className="mt-0.5 shrink-0" size={16} color={pack.featured ? ROSA : TOMATE} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-black uppercase"
                  style={{ background: pack.featured ? ROSA : VERDE, color: pack.featured ? VERDE : "#fff" }}
                >
                  Solicitar orçamento
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="galeria" className="px-4 py-14 md:px-6 lg:py-20" style={{ background: CREME }}>
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Visual de festa"
            title="Montagem bonita, mesa cheia e identidade Menfi's."
            copy="Fotos de referencia do buffet para mostrar variedade, volume e acabamento de evento."
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
            {gallery.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`Galeria Menfi's Buffet ${index + 1}`}
                className={`h-full min-h-52 w-full rounded-3xl object-cover ${index === 0 ? "md:row-span-2 md:min-h-[430px]" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] lg:grid-cols-[1fr_0.9fr]" style={{ background: VERDE }}>
          <div className="p-7 text-white sm:p-10 lg:p-14">
            <BeerOff size={28} color={ROSA} />
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Quer levar o Menfi's para sua festa?</h2>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/75">
              Monte seu pacote e solicite um orçamento personalizado pelo WhatsApp. A gente te ajuda a escolher quantidade, sabores, montagem e formato ideal para o seu evento.
            </p>
            <a
              href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-black uppercase"
              style={{ background: ROSA, color: VERDE }}
            >
              Solicite seu orçamento
              <MessageCircle size={18} />
            </a>
          </div>
          <img src={heroImage} alt="Buffet Menfi's para festa" className="h-full min-h-80 w-full object-cover" />
        </div>
      </section>

      <footer className="border-t border-[#314A37]/10 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-[#314A37]/65 md:flex-row md:items-center md:justify-between">
          <span>Menfi's Buffet — Fortaleza, Ceara</span>
          <span>Mini burgers artesanais para eventos inesqueciveis.</span>
        </div>
      </footer>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: TOMATE }}>
      {children}
    </p>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-[#314A37]/65 sm:text-base">{copy}</p>
    </div>
  );
}

function MenuBlock({
  icon,
  title,
  items,
  note,
  highlight = false,
  dark = false,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[][];
  note?: string;
  highlight?: boolean;
  dark?: boolean;
}) {
  const background = dark ? VERDE : highlight ? CREME : "#fff";
  const color = dark ? "#fff" : VERDE;
  return (
    <article className="rounded-3xl p-5 sm:p-6" style={{ background, color, border: `1.5px solid ${dark ? VERDE : `${VERDE}16`}` }}>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: dark ? `${ROSA}22` : `${ROSA}55`, color: dark ? ROSA : VERDE }}>
          {icon}
        </span>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      <div className="grid gap-3">
        {items.map(([name, desc]) => (
          <div key={name} className="rounded-2xl p-4" style={{ background: dark ? "rgba(255,255,255,0.08)" : "#fff", border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : `${VERDE}12`}` }}>
            <p className="font-black">{name}</p>
            <p className={`mt-1 text-sm font-semibold leading-relaxed ${dark ? "text-white/68" : "text-[#314A37]/62"}`}>{desc}</p>
          </div>
        ))}
      </div>
      {note && <p className={`mt-5 text-xs font-bold leading-relaxed ${dark ? "text-white/60" : "text-[#314A37]/58"}`}>{note}</p>}
    </article>
  );
}

function PhotoPanel({ image, title, copy, compact = false }: { image: string; title: string; copy: string; compact?: boolean }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[#314A37]/10 bg-white">
      <img src={image} alt={title} className={`w-full object-cover ${compact ? "h-72" : "h-80 lg:h-full"}`} />
      <div className="p-5">
        <p className="text-xl font-black">{title}</p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#314A37]/62">{copy}</p>
      </div>
    </article>
  );
}
