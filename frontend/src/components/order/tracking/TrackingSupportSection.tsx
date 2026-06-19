import { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bike, CheckCircle2, KeyRound, MessageCircle, PackageCheck, Route, X } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { deliveryConfirmationCode, SUPPORT_TOPICS, SupportTicket, WHATSAPP_URL } from "../tracking";

type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export function TrackingSupportSection({
  order,
  delayed,
  staleTicket,
  whatsappText,
  delayedWhatsappText,
  supportSent,
  supportOpen,
  selectedTopic,
  canRequestChange,
  setSupportOpen,
  setSelectedTopic,
  setSupportSent,
  createSupportTicket,
}: {
  order: Order;
  delayed: boolean;
  staleTicket?: SupportTicket;
  whatsappText: string;
  delayedWhatsappText: string;
  supportSent: string;
  supportOpen: boolean;
  selectedTopic: SupportTopic | null;
  canRequestChange: boolean;
  setSupportOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedTopic: Dispatch<SetStateAction<SupportTopic | null>>;
  setSupportSent: Dispatch<SetStateAction<string>>;
  createSupportTicket: (type: string, reason: string) => void;
}) {
  return (
    <>
      {delayed && (
        <div className="rounded-2xl p-4" style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
          <p className="text-sm font-black" style={{ color: "#92400E" }}>
            Seu pedido está demorando mais que o esperado.
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#92400E", opacity: 0.72 }}>
            Nossa equipe já foi notificada. Você também pode falar diretamente com a Menfi's.
          </p>
          <a
            href={`${WHATSAPP_URL}?text=${delayedWhatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{ background: VERDE, color: ROSA }}
          >
            <MessageCircle size={15} strokeWidth={2.5} />
            Falar com a Menfi's
          </a>
        </div>
      )}

      {staleTicket && (
        <div className="rounded-2xl p-4" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
          <p className="text-sm font-black" style={{ color: "#991B1B" }}>
            Sua solicitação ainda está pendente.
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#991B1B", opacity: 0.72 }}>
            Para agilizar, fale diretamente com a equipe pelo WhatsApp.
          </p>
          <a
            href={`${WHATSAPP_URL}?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{ background: VERDE, color: ROSA }}
          >
            <MessageCircle size={15} strokeWidth={2.5} />
            Falar diretamente com a equipe
          </a>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <DeliveryOperationCard order={order} />
        <SupportCard
          supportSent={supportSent}
          setSupportOpen={setSupportOpen}
          setSelectedTopic={setSelectedTopic}
          setSupportSent={setSupportSent}
          createSupportTicket={createSupportTicket}
        />
      </div>

      <div
        className="rounded-[22px] p-4"
        style={{ background: `linear-gradient(90deg, ${ROSA}55, #fff)`, border: `1.5px solid ${ROSA}` }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "#EF4C86", color: "#fff" }}>
              <MessageCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: VERDE }}>
                Fale direto com a Menfi's
              </p>
              <p className="text-[11px]" style={{ color: VERDE, opacity: 0.58 }}>
                Nossa equipe está pronta para te atender.
              </p>
            </div>
          </div>
          <a
            href={`${WHATSAPP_URL}?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black"
            style={{ background: VERDE, color: ROSA }}
          >
            <MessageCircle size={20} strokeWidth={2.5} />
            Chamar no WhatsApp
          </a>
        </div>
      </div>

      <SupportModal
        order={order}
        supportOpen={supportOpen}
        selectedTopic={selectedTopic}
        canRequestChange={canRequestChange}
        whatsappText={whatsappText}
        setSupportOpen={setSupportOpen}
        setSelectedTopic={setSelectedTopic}
        createSupportTicket={createSupportTicket}
      />
    </>
  );
}

function DeliveryOperationCard({ order }: { order: Order }) {
  const confirmationCode = deliveryConfirmationCode(order);
  const isOut = order.status === "OUT_FOR_DELIVERY";
  const delivered = order.status === "DELIVERED";

  return (
    <div className="rounded-[22px] p-4" style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: delivered ? "#DCFCE7" : `${ROSA}70`, color: VERDE }}
        >
          {delivered ? <PackageCheck size={22} strokeWidth={2.4} /> : <Route size={22} strokeWidth={2.4} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black" style={{ color: VERDE }}>
            {delivered ? "Entrega confirmada" : isOut ? "Entrega em rota" : "Entrega segura"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
            {delivered
              ? "Pedido entregue com confirmação. Obrigado por comprar com a Menfi's."
              : isOut
                ? "Informe o código abaixo ao motoboy somente ao receber o pedido."
                : "Quando o pedido sair, o motoboy confirmará a entrega no app dele usando o código do cliente."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl p-3" style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}12` }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: VERDE, opacity: 0.45 }}>
            Pedido
          </p>
          <p className="mt-1 text-xl font-black" style={{ color: VERDE }}>{order.id}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}12` }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: VERDE, opacity: 0.45 }}>
            Espera
          </p>
          <p className="mt-1 text-xl font-black" style={{ color: VERDE }}>25-30 min</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: `${ROSA}55`, border: `1.5px solid ${VERDE}` }}>
          <div className="flex items-center gap-1.5">
            <KeyRound size={14} strokeWidth={2.4} style={{ color: VERDE }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: VERDE, opacity: 0.68 }}>
              Código
            </p>
          </div>
          <p className="mt-1 text-2xl font-black tracking-widest" style={{ color: VERDE }}>
            {confirmationCode}
          </p>
        </div>
      </div>

      {isOut && (
        <div className="mt-3 rounded-2xl p-3" style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#065F46" }}>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide">
            <Bike size={15} strokeWidth={2.4} />
            Motoboy a caminho
          </p>
          <p className="mt-1 text-[11px] font-bold opacity-75">
            Confirme o recebimento apenas quando o pedido chegar e informe o código {confirmationCode}.
          </p>
        </div>
      )}
      {delivered && (
        <div className="mt-3 rounded-2xl p-3" style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#065F46" }}>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide">
            <CheckCircle2 size={15} strokeWidth={2.4} />
            Pedido entregue com segurança
          </p>
          <p className="mt-1 text-[11px] font-bold opacity-75">
            A entrega foi finalizada pelo motoboy.
          </p>
        </div>
      )}
      </div>
  );
}

function SupportCard({
  supportSent,
  setSupportOpen,
  setSelectedTopic,
  setSupportSent,
  createSupportTicket,
}: {
  supportSent: string;
  setSupportOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedTopic: Dispatch<SetStateAction<SupportTopic | null>>;
  setSupportSent: Dispatch<SetStateAction<string>>;
  createSupportTicket: (type: string, reason: string) => void;
}) {
  return (
    <div className="rounded-[22px] p-4" style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black" style={{ color: VERDE }}>Precisa de ajuda?</p>
          <p className="mt-1 text-[11px]" style={{ color: VERDE, opacity: 0.58 }}>
            Escolha uma opção abaixo para falar com a gente.
          </p>
        </div>
        <button
          onClick={() => {
            setSupportOpen(true);
            setSelectedTopic(null);
            setSupportSent("");
          }}
          className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider"
          style={{ background: `${ROSA}70`, color: VERDE }}
        >
          SAC
        </button>
      </div>
      {supportSent && (
        <p className="text-[11px] font-bold mt-3" style={{ color: "#065F46" }}>
          {supportSent}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SUPPORT_TOPICS.slice(0, 6).map((topic) => (
          <button
            key={topic.type}
            onClick={() => {
              if (topic.type === "TALK_TO_AGENT") {
                createSupportTicket(topic.type, topic.reasons[0]);
              } else {
                setSupportOpen(true);
                setSelectedTopic(topic);
              }
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-[11px] font-bold"
            style={{ background: "#fff", border: `1px solid ${ROSA}`, color: VERDE }}
          >
            <span>{topic.icon}</span>
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SupportModal({
  order,
  supportOpen,
  selectedTopic,
  canRequestChange,
  whatsappText,
  setSupportOpen,
  setSelectedTopic,
  createSupportTicket,
}: {
  order: Order;
  supportOpen: boolean;
  selectedTopic: SupportTopic | null;
  canRequestChange: boolean;
  whatsappText: string;
  setSupportOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedTopic: Dispatch<SetStateAction<SupportTopic | null>>;
  createSupportTicket: (type: string, reason: string) => void;
}) {
  return (
    <AnimatePresence>
      {supportOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.42)" }}
          onClick={() => setSupportOpen(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="w-full rounded-t-[28px] p-5"
            style={{ background: "#fff", maxHeight: "82vh", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <p className="text-lg font-black" style={{ color: VERDE }}>Como podemos ajudar?</p>
                <p className="text-[11px] mt-1" style={{ color: VERDE, opacity: 0.55 }}>
                  Pedido {order.id}
                </p>
              </div>
              <button
                onClick={() => setSupportOpen(false)}
                className="rounded-full flex items-center justify-center"
                style={{ width: 38, height: 38, background: `${VERDE}08`, color: VERDE, border: "none" }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {!selectedTopic ? (
              <div className="flex flex-col gap-2">
                {SUPPORT_TOPICS.map((topic) => (
                  <button
                    key={topic.type}
                    onClick={() => setSelectedTopic(topic)}
                    disabled={topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-left"
                    style={{
                      background: "#fff",
                      border: `1px solid ${ROSA}`,
                      color: VERDE,
                      opacity: topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange ? 0.45 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{topic.icon}</span>
                    <span className="flex-1">
                      <span className="block font-black text-sm">{topic.label}</span>
                      {topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange && (
                        <span className="block text-[10px] mt-1" style={{ opacity: 0.7 }}>
                          Disponível apenas antes do preparo.
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                <a
                  href={`${WHATSAPP_URL}?text=${whatsappText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-black text-xs uppercase tracking-wider"
                  style={{ background: VERDE, color: ROSA }}
                >
                  <MessageCircle size={16} strokeWidth={2.5} />
                  WhatsApp Menfi's
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="self-start text-xs font-black uppercase tracking-wider"
                  style={{ color: VERDE, background: "transparent", border: "none" }}
                >
                  Voltar
                </button>
                <p className="font-black mb-1" style={{ color: VERDE }}>
                  {selectedTopic.icon} {selectedTopic.label}
                </p>
                {selectedTopic.reasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => createSupportTicket(selectedTopic.type, reason)}
                    className="w-full rounded-2xl px-4 py-4 text-left text-sm font-bold"
                    style={{ background: "#fff", border: `1px solid ${ROSA}`, color: VERDE }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
