import { Activity, CheckCircle2, ExternalLink, KeyRound, MousePointerClick, ShieldCheck } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";

const PIXEL_ID = "1451662243464965";
const EVENTS_MANAGER_URL = `https://business.facebook.com/events_manager2/list/pixel/${PIXEL_ID}/overview`;

export function MetaMetricsView() {
  return (
    <div className="min-h-screen bg-[#FFF8F2] p-4 text-[#314A37] lg:p-6">
      <section className="rounded-3xl p-6 text-white shadow-xl lg:p-8" style={{ background: "#750020" }}>
        <p className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: ROSA }}>Marketing e conversão</p>
        <h1 className="mt-2 text-3xl font-black lg:text-4xl">Meta / Facebook</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-white/65">Acompanhe a instalação do Pixel e acesse as métricas oficiais de tráfego e conversão.</p>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card icon={<CheckCircle2 />} title="Pixel ativo" value="Conectado" detail={`ID ${PIXEL_ID}`} positive />
        <Card icon={<MousePointerClick />} title="Evento instalado" value="PageView" detail="Acessos ao cardápio e checkout público" positive />
        <Card icon={<ShieldCheck />} title="Tráfego interno" value="Ignorado" detail="ADM, KDS, notas, entrega e relatórios" positive />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${VERDE}18` }}>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-black">Métricas do Facebook</h2><p className="mt-1 text-xs font-semibold opacity-55">Os dados oficiais ficam no Gerenciador de Eventos da Meta.</p></div>
            <Activity />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Visualizações de página", "Usuários alcançados", "Origem do tráfego", "Eventos recebidos"].map(label => <div key={label} className="rounded-xl bg-[#FFF8F2] p-4"><p className="text-[10px] font-black uppercase tracking-wider opacity-45">{label}</p><p className="mt-2 text-sm font-black">Consultar na Meta</p></div>)}
          </div>
          <a href={EVENTS_MANAGER_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-xs font-black text-white" style={{ background: VERDE }}>Abrir Gerenciador de Eventos <ExternalLink size={15}/></a>
        </article>

        <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${VERDE}18` }}>
          <KeyRound />
          <h2 className="mt-4 text-lg font-black">Métricas dentro do ERP</h2>
          <p className="mt-2 text-xs font-semibold leading-5 opacity-60">O Pixel envia eventos, mas não autoriza a leitura dos relatórios. Para trazer números oficiais para esta tela, configure no backend:</p>
          <ul className="mt-4 grid gap-2 text-xs font-black">
            <li className="rounded-xl bg-[#FFF8F2] p-3">META_ACCESS_TOKEN</li>
            <li className="rounded-xl bg-[#FFF8F2] p-3">META_AD_ACCOUNT_ID</li>
            <li className="rounded-xl bg-[#FFF8F2] p-3">META_GRAPH_API_VERSION</li>
          </ul>
          <p className="mt-4 text-[10px] font-bold text-red-800">Esses valores devem existir somente na Railway e nunca em NEXT_PUBLIC_ ou no navegador.</p>
        </article>
      </section>
    </div>
  );
}

function Card({ icon, title, value, detail, positive }: { icon: React.ReactNode; title: string; value: string; detail: string; positive?: boolean }) {
  return <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${VERDE}18` }}><span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: positive ? "#DCFCE7" : `${ROSA}55`, color: positive ? "#15803D" : VERDE }}>{icon}</span><p className="mt-4 text-[9px] font-black uppercase tracking-widest opacity-45">{title}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold opacity-55">{detail}</p></article>;
}
