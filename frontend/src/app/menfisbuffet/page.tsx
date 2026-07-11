import type { Metadata } from "next";
import {
  ArrowRight,
  CakeSlice,
  Check,
  CupSoda,
  Gift,
  Mail,
  MapPin,
  Martini,
  MessageCircle,
  Phone,
  Pizza,
  Sandwich,
  Sparkles,
  Utensils,
} from "lucide-react";
import { BuffetAssistant } from "./BuffetAssistant";

export const metadata: Metadata = {
  title: "Menfis Buffet | Mini burgers, salgados, doces e bebidas para festas",
  description:
    "Menfis Buffet para aniversarios, eventos corporativos e celebracoes com mini hamburgueres artesanais, salgados, mini pizzas, doces, bebidas e drinks tropicais.",
};

const VERDE = "#314A37";
const ROSA = "#F8B7C8";
const CREME = "#FFF8F2";
const TOMATE = "#C2410C";
const WHATSAPP = "https://wa.me/5585997883764";
const WHATSAPP_TEXT = encodeURIComponent(
  "Olá! Quero levar o Menfi's Buffet para minha festa. Pode me ajudar a montar um orçamento personalizado?",
);

const buffetImage = (file: string) => `/menfisbuffet-static/${file}`;

const heroImage = buffetImage("51249c626219f0979a899f7ac154adbb.jpg");
const burgerImage = buffetImage("c399bea57b582447054409573018894e.jpg");
const miniEventImage = buffetImage("4f5aa646709ea409a634e71aa72dee3e.jpg");
const logoImage = "/logo_buffet.jpeg";
const sweetImages = [
  "/buffetdoce/principal%20.png",
  "/buffetdoce/0460c31aed356c18e164f87576e2c438.jpg",
  "/buffetdoce/0c03983861d36937a7b80eb46ab65768.jpg",
  "/buffetdoce/6f0caded864e41613220f4f5a2767877.jpg",
];

const miniBurgers = [
  ["Mini Menfi's Burger", "Blend bovino, cheddar e molho Menfi's."],
  ["Mini Chicken", "Frango crocante, cheddar e molho especial."],
  ["Mini Bacon", "Blend bovino, cheddar, bacon e molho Menfi's."],
  ["Mini Kids Burger", "Versao infantil mais simples, com queijo e molho suave."],
];

const salgados = [
  ["Coxinha de frango", "Classica, cremosa e crocante."],
  ["Bolinha de queijo", "Massa leve com recheio de queijo."],
  ["Risole de presunto e queijo", "Massa crocante com recheio cremoso."],
  ["Kibe", "Temperado, crocante e bem sequinho."],
];

const pizzas = [
  ["Mini Pizza Marguerita", "Molho de tomate, queijo, tomate e manjericao."],
  ["Mini Pizza Italiana", "Calabresa italiana com queijo e oregano."],
  ["Quatro queijos", "Uma combinação cremosa e cheia de sabor."],
  ["Frango com catupiry", "Frango temperado com catupiry cremoso."],
];

const classicSweets = [
  ["Brigadeiro tradicional", "Chocolate classico."],
  ["Beijinho", "Coco com leite condensado."],
  ["Cajuzinho", "Amendoim tradicional."],
  ["Casadinho", "Brigadeiro branco com chocolate."],
];

const specialSweets = [
  ["Brigadeiro de pistache", "Cremoso e delicadamente sofisticado."],
  ["Brigadeiro de Oreo", "Chocolate cremoso com o sabor marcante de Oreo."],
  ["Ninho com Nutella", "Leite Ninho com recheio cremoso de Nutella."],
  ["Brownie bite", "Mini brownie em pedacos individuais."],
];

const drinks = [
  ["Suco natural", "Laranja, acerola, maracuja ou caja."],
  ["Agua mineral", "Com e sem gas."],
  ["Refrigerante", "Coca-Cola, Guarana e opcoes zero."],
  ["Cha gelado", "Limao ou pessego."],
  ["Agua saborizada", "Limao, hortela e frutas."],
];

const tropicalDrinks = [
  ["Pink Lemonade Menfi's", "Limao, frutas vermelhas e gelo."],
  ["Mojito tropical", "Limao, hortela, agua com gas e acucar."],
  ["Soda italiana", "Xarope de fruta, gelo e agua com gas."],
  ["Tropical Kids", "Suco de laranja, abacaxi e gelo."],
  ["Menfi's Fresh", "Limao, hortela e agua gaseificada."],
];

const packages = [
  {
    name: "Pequenas Reuniões",
    ideal: "Para reunir quem você gosta com sabor, carinho e praticidade.",
    items: [
      "Mini hamburgueres Menfi's",
      "Salgadinhos classicos",
      "Mini pizzas",
      "Docinhos classicos",
      "Bebidas infantis",
    ],
  },
  {
    name: "Grandes Comemorações",
    ideal: "Uma mesa completa e marcante para celebrar com todos os convidados.",
    featured: true,
    items: [
      "Mini hamburgueres variados",
      "4 salgadinhos classicos",
      "2 sabores de mini pizza",
      "4 docinhos classicos",
      "4 docinhos especiais",
      "Praca de bebidas infantis",
      "Drinks tropicais",
      "Montagem de mesa Menfi's",
    ],
  },
  {
    name: "Dias Marcantes",
    ideal: "Para casamentos, conquistas e momentos que merecem ser inesquecíveis.",
    items: [
      "Estacao de mini burgers",
      "Salgados classicos",
      "Mini pizzas artesanais",
      "Doces classicos e especiais",
      "Praca de bebidas",
      "Drinks tropicais",
      "Equipe de apoio",
      "Montagem visual personalizada",
      "Embalagens e identidade Menfi's",
    ],
  },
];

const categoryHighlights = [
  {
    title: "Mini burgers",
    href: "#acervo-mini-burgers",
    image: buffetImage("83f021109f03ee421aad67a7972f97a4.jpg"),
    copy: "Mini burgers artesanais preparados para encantar seus convidados.",
  },
  {
    title: "Mini pizzas",
    href: "#acervo-mini-pizzas",
    image: buffetImage("pizzamini.jpg"),
    copy: "Sabores familiares para completar o menu e agradar diferentes convidados.",
  },
  {
    title: "Salgados",
    href: "#acervo-salgados",
    image: buffetImage("179bbadd456feddb6033fdae4f7466e8.jpg"),
    copy: "Coxinhas, bolinhas, kibes e empadas douradas e crocantes.",
  },
  {
    title: "Montagens",
    href: "#acervo-montagens",
    image: buffetImage("2866d06071e440916ea19a0bfbad0dd3.jpg"),
    copy: "Mesas completas com volume, variedade e apresentacao para evento.",
  },
  {
    title: "Doces",
    href: "#acervo-doces",
    image: sweetImages[0],
    copy: "Docinhos classicos e especiais com acabamento caprichado para a mesa da festa.",
  },
];

const gallerySections = [
  {
    id: "acervo-mini-burgers",
    title: "Mini burgers e combos infantis",
    copy: "Burgers artesanais, mini chicken, acompanhamentos e caixas para festa.",
    images: [
      buffetImage("83f021109f03ee421aad67a7972f97a4.jpg"),
      buffetImage("c399bea57b582447054409573018894e.jpg"),
      buffetImage("4f5aa646709ea409a634e71aa72dee3e.jpg"),
      buffetImage("6acc5f4a09b5eae74ffc742ddf7f0e44.jpg"),
      buffetImage("8696e5861d3147173c9bdf315745c35c.jpg"),
      "/menfisbuffet-static/assets/image-4-XDcwhyYc.png",
      "/menfisbuffet-static/assets/image-6-5SjDxcF7.png",
    ],
  },
  {
    id: "acervo-mini-pizzas",
    title: "Mini pizzas",
    copy: "Mini pizzas em bandejas, caixas e combinacoes com outros itens do buffet.",
    images: [
      buffetImage("pizzamini.jpg"),
      buffetImage("6d35d89fc3bf214e19cec00006c307de.jpg"),
      buffetImage("4f5aa646709ea409a634e71aa72dee3e.jpg"),
      buffetImage("55026341e085bd03a74275d48dc0ba4a.jpg"),
      "/menfisbuffet-static/assets/image-1-3BC4Og4k.png",
    ],
  },
  {
    id: "acervo-salgados",
    title: "Salgados e acompanhamentos",
    copy: "Salgados classicos, empadas, sanduiches e porcoes para reforcar a mesa.",
    images: [
      buffetImage("179bbadd456feddb6033fdae4f7466e8.jpg"),
      buffetImage("bf62121a2569ed53eade2b95d11a4e48.jpg"),
      buffetImage("55026341e085bd03a74275d48dc0ba4a.jpg"),
      buffetImage("20cc3b5d7a70580c9f931785e0e1f70c.jpg"),
      buffetImage("67079aa4015289e2a886ab5880001c10.jpg"),
      buffetImage("bc215ee2e6bfa96b8206541f75395849.jpg"),
      buffetImage("fcc9ef2182eb0eb26910f77225661259.jpg"),
    ],
  },
  {
    id: "acervo-doces",
    title: "Doces classicos e especiais",
    copy: "Brigadeiros, beijinhos e sabores especiais preparados para completar a mesa do evento.",
    images: sweetImages,
  },
  {
    id: "acervo-montagens",
    title: "Montagens de evento",
    copy: "Mesas completas, caixas montadas e apresentacao visual para eventos maiores.",
    images: [
      buffetImage("51249c626219f0979a899f7ac154adbb.jpg"),
      buffetImage("2866d06071e440916ea19a0bfbad0dd3.jpg"),
      buffetImage("cff2556e865bae7b826286333246f1d5.jpg"),
      buffetImage("669bf2ba91fc4116a5fa420225251763.jpg"),
      buffetImage("8696e5861d3147173c9bdf315745c35c.jpg"),
      "/menfisbuffet-static/assets/image-8-6OiReUZY.png",
    ],
  },
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
              Buffet artesanal para eventos
            </p>
            <h1 className="text-5xl font-black leading-none sm:text-6xl lg:text-7xl">Menfi's Buffet</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/88 sm:text-lg">
              Levamos a experiência completa Menfi's para festas e eventos, com mini burgers artesanais, salgados, mini pizzas, doces, bebidas e drinks tropicais.
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
            Nosso cardápio conta com mini hambúrgueres artesanais, salgadinhos clássicos, mini pizzas, docinhos especiais, praça de bebidas e drinks tropicais. Montamos uma experiência completa, visual e saborosa para deixar seu evento mais prático, bonito e inesquecível.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categoryHighlights.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group overflow-hidden rounded-3xl border border-[#314A37]/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#314A37]/12"
            >
              <img src={item.image} alt={item.title} className="h-48 w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <ArrowRight size={18} color={TOMATE} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#314A37]/62">{item.copy}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="cardapio" className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Cardapio Menfi's Buffet"
            title="Sabores variados para uma celebração completa."
            copy="Mini burgers, salgadinhos, mini pizzas, doces, bebidas, drinks tropicais e pacotes para diferentes tipos de evento."
          />

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <MenuBlock icon={<Sandwich size={22} />} title="Mini Hamburgueres Menfi's" items={miniBurgers} highlight />
            <PhotoPanel image={burgerImage} title="Principal da casa" copy="Mini brioche, blend artesanal, cheddar, molho Menfi's e finalizacao da casa." />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <MenuBlock icon={<Utensils size={22} />} title="Salgadinhos classicos" items={salgados} />
            <MenuBlock icon={<Pizza size={22} />} title="Mini pizzas" items={pizzas} />
            <PhotoPanel image={miniEventImage} title="Montagem de festa" copy="Mesa com variedade, organizacao e identidade Menfi's para receber seus convidados." compact />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <MenuBlock icon={<CakeSlice size={22} />} title="4 docinhos classicos" items={classicSweets} />
            <MenuBlock icon={<Sparkles size={22} />} title="4 docinhos especiais Menfi's" items={specialSweets} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
            {sweetImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`Doces Menfi's Buffet ${index + 1}`}
                className={`h-52 w-full rounded-3xl object-cover sm:h-64 ${index === 0 ? "col-span-2 md:col-span-1" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="bebidas" className="px-4 py-14 md:px-6 lg:py-20" style={{ background: CREME }}>
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Praca de bebidas"
            title="Bebidas e drinks tropicais para deixar o buffet ainda mais completo."
            copy="Sucos, refrigerantes, água saborizada e drinks tropicais para acompanhar a experiência do buffet."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <MenuBlock icon={<CupSoda size={22} />} title="Bebidas infantis" items={drinks} />
            <MenuBlock icon={<Martini size={22} />} title="Drinks tropicais" items={tropicalDrinks} dark />
          </div>
        </div>
      </section>

      <section id="pacotes" className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Pacotes para festas"
            title="Escolha o formato ideal para sua festa."
            copy="Pacotes pensados para aniversarios, eventos corporativos, confraternizacoes e celebracoes especiais."
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
                    Mais completo
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
            eyebrow="Nossas celebrações"
            title="Mesas completas, apresentação impecável e identidade Menfi's."
            copy="Conheça de perto os sabores e montagens que preparamos para tornar cada evento especial."
          />
          <div className="grid gap-8">
            {gallerySections.map((section) => (
              <section key={section.title} id={section.id} className="scroll-mt-24">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{section.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#314A37]/62">{section.copy}</p>
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: TOMATE }}>
                    {section.images.length} fotos
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
                  {section.images.map((image, index) => (
                    <img
                      key={`${section.title}-${image}-${index}`}
                      src={image}
                      alt={`${section.title} Menfi's Buffet ${index + 1}`}
                      className={`h-full min-h-52 w-full rounded-3xl object-cover ${index === 0 ? "md:col-span-2 md:min-h-[430px]" : ""}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] lg:grid-cols-[1fr_0.9fr]" style={{ background: VERDE }}>
          <div className="p-7 text-white sm:p-10 lg:p-14">
            <Sparkles size={28} color={ROSA} />
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

      <footer className="px-4 pb-8 pt-14 text-white md:px-6 lg:pt-16" style={{ background: VERDE }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.9fr]">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Menfi's Buffet" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/20" />
                <div>
                  <p className="text-xl font-black">Menfi's Buffet</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/55">Eventos em Fortaleza</p>
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold leading-relaxed text-white/68">
                Mini burgers artesanais, salgados, pizzas, doces e bebidas para aniversarios, confraternizacoes e eventos especiais.
              </p>
              <a href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-black" style={{ background: ROSA, color: VERDE }}>
                <MessageCircle size={18} /> Solicitar orçamento
              </a>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: ROSA }}>Navegação</p>
              <nav className="mt-5 grid gap-3 text-sm font-bold text-white/70" aria-label="Links do rodapé">
                <a className="transition hover:text-white" href="#cardapio">Cardápio</a>
                <a className="transition hover:text-white" href="#bebidas">Bebidas</a>
                <a className="transition hover:text-white" href="#pacotes">Pacotes para festas</a>
                <a className="transition hover:text-white" href="#galeria">Galeria</a>
                <a className="transition hover:text-white" href="/">Menfi's Burger</a>
              </nav>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: ROSA }}>Fale com a gente</p>
              <div className="mt-5 grid gap-4 text-sm font-semibold text-white/70">
                <a href={`${WHATSAPP}?text=${WHATSAPP_TEXT}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 transition hover:text-white">
                  <Phone className="mt-0.5 shrink-0" size={18} color={ROSA} />
                  <span><strong className="block text-white">WhatsApp</strong>(85) 99788-3764</span>
                </a>
                <a href="mailto:rodrigomuinhostattooist@gmail.com" className="flex items-start gap-3 break-all transition hover:text-white">
                  <Mail className="mt-0.5 shrink-0" size={18} color={ROSA} />
                  <span><strong className="block text-white">E-mail</strong>rodrigomuinhostattooist@gmail.com</span>
                </a>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0" size={18} color={ROSA} />
                  <span><strong className="block text-white">Atendimento</strong>Fortaleza, Ceará</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 py-6 text-xs font-semibold text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Menfi's Buffet. Todos os direitos reservados.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a className="transition hover:text-white" href="/politica-de-privacidade">Política de privacidade</a>
              <a className="transition hover:text-white" href="/termos-de-servico">Termos de serviço</a>
            </div>
          </div>
        </div>
      </footer>
      <BuffetAssistant />
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
