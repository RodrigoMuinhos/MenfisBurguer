"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, MessageCircle, Send, Sparkles, Users, X } from "lucide-react";

const VERDE = "#314A37";
const ROSA = "#F8B7C8";
const PHONE = "5585997883764";

type Answers = {
  name: string;
  event: string;
  date: string;
  time: string;
  guests: string;
  location: string;
};

type Message = { id: number; from: "bot" | "user"; text: string };

const questions = [
  "Antes de tudo, como posso te chamar?",
  "Prazer! Que tipo de evento você está planejando?",
  "Legal! Qual é a data prevista?",
  "E qual horário você imagina para o evento?",
  "Para quantas pessoas, aproximadamente?",
  "E em qual bairro e cidade será o evento?",
];

const initialMessages: Message[] = [
  { id: 1, from: "bot", text: "Olá! Eu sou a Melina, do Menfi's Buffet 👋" },
  { id: 2, from: "bot", text: "Vou te ajudar a pensar no buffet ideal para o seu evento. Para começarmos, como posso te chamar?" },
];

function parseBrazilianDate(value: string) {
  const parts = value.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})/);
  const compact = value.replace(/\D/g, "");
  const day = Number(parts?.[1] ?? compact.slice(0, 2));
  const month = Number(parts?.[2] ?? compact.slice(2, 4));
  let year = Number(parts?.[3] ?? compact.slice(4, 8));
  if (year < 100) year += 2000;
  const date = new Date(year, month - 1, day, 12);
  if (!day || !month || !year || date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return null;
  return date;
}

function dateObservation(value: string) {
  const date = parseBrazilianDate(value);
  if (!date) return "Tudo bem, anotei a data como você me contou.";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86400000);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
  const distance = days === 0
    ? "é hoje"
    : days === 1
      ? "é amanhã"
      : days > 1
        ? days >= 60
          ? `é daqui a aproximadamente ${Math.round(days / 30)} meses`
          : `é daqui a ${days} dias`
        : `foi há ${Math.abs(days)} dias`;
  return `Vi que essa data cai em ${weekday} e ${distance}.`;
}

function contextualReply(step: number, value: string, answers: Answers) {
  if (step === 0) return `Que bom falar com você, ${value}! 😊 ${questions[1]}`;
  if (step === 1) return `${answers.event} vai ser muito especial! ${questions[2]}`;
  if (step === 2) return `${dateObservation(value)} ${questions[3]}`;
  if (step === 3) return `Perfeito, vou considerar o início às ${value}. ${questions[4]}`;
  if (step === 4) return `Ótimo, já consigo ter uma boa ideia do tamanho da estrutura. ${questions[5]}`;
  return questions[step + 1] ?? "";
}

function responseDelay(message: string) {
  return Math.min(3200, Math.max(1400, 850 + message.length * 14));
}

export function BuffetAssistant() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [answers, setAnswers] = useState<Answers>({ name: "", event: "", date: "", time: "", guests: "", location: "" });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    return () => window.cancelAnimationFrame(frame);
  }, [messages, open, error]);

  const addMessage = (from: Message["from"], text: string) => {
    setMessages((current) => [...current, { id: Date.now() + current.length, from, text }]);
  };

  const validate = (value: string) => {
    return value ? "" : "Pode me responder do seu jeito 😊";
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    const validation = validate(value);
    if (validation) return setError(validation);

    setError("");
    setInput("");
    addMessage("user", value);
    const fields: Array<keyof Answers> = ["name", "event", "date", "time", "guests", "location"];
    const nextAnswers = { ...answers, [fields[step]]: value };
    setAnswers(nextAnswers);
    setTyping(true);

    if (step < questions.length - 1) {
      const reply = contextualReply(step, value, nextAnswers);
      window.setTimeout(() => {
        addMessage("bot", reply);
        setStep(step + 1);
        setTyping(false);
      }, responseDelay(reply));
    } else {
      window.setTimeout(() => {
        addMessage("bot", `Obrigada pelas informações, ${nextAnswers.name}! Já deixei tudo organizado para a nossa equipe entender seu evento e te atender mais rápido. 💚`);
        setStep(questions.length);
        setTyping(false);
      }, 1900);
    }
  };

  const whatsappUrl = () => {
    const guestCount = Number(answers.guests.replace(/\D/g, ""));
    const suggestedPackage = guestCount > 0 && guestCount <= 30
      ? "Pequenas Reuniões"
      : guestCount > 30 && guestCount <= 80
        ? "Grandes Comemorações"
        : guestCount > 80
          ? "Dias Marcantes"
          : "uma opção personalizada";
    const text = [
      "Olá, equipe Menfi's Buffet! Tudo bem? 😊",
      "",
      `Meu nome é ${answers.name} e estou organizando ${answers.event}. A Melina me ajudou a adiantar as principais informações:`,
      "",
      `📅 Data prevista: ${answers.date}`,
      `🕐 Horário previsto: ${answers.time}`,
      `👥 Número de convidados: ${answers.guests}`,
      `📍 Local do evento: ${answers.location}`,
      `🎉 Sugestão inicial: ${suggestedPackage}`,
      "",
      `Gostaria de confirmar a disponibilidade para ${answers.date} e receber uma proposta com valores, quantidades e opções de cardápio para o pacote ${suggestedPackage}.`,
      "",
      "Fico no aguardo. Obrigado(a)! 💚",
    ].join("\n");
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  };

  const suggestedPackage = () => {
    const guests = Number(answers.guests.replace(/\D/g, ""));
    if (!guests) return "Opção personalizada";
    if (guests <= 30) return "Pequenas Reuniões";
    if (guests <= 80) return "Grandes Comemorações";
    return "Dias Marcantes";
  };

  const restart = () => {
    setStep(0);
    setTyping(false);
    setInput("");
    setError("");
    setAnswers({ name: "", event: "", date: "", time: "", guests: "", location: "" });
    setMessages(initialMessages);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl" aria-label="Assistente de orçamento Menfi's Buffet">
          <header className="flex items-center justify-between px-5 py-4 text-white" style={{ background: VERDE }}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: ROSA, color: VERDE }}><Sparkles size={19} /></span>
              <div><p className="text-sm font-black">Melina · Menfi's Buffet</p><p className="text-[11px] font-semibold text-white/65">Vamos planejar seu evento</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar conversa" className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><X size={18} /></button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#FFF8F2] px-4 py-5">
            <div className="grid gap-3">
              {messages.map((message) => (
                <div key={message.id} className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed ${message.from === "user" ? "ml-auto rounded-br-md text-white" : "rounded-bl-md bg-white"}`} style={message.from === "user" ? { background: VERDE } : { color: VERDE, boxShadow: "0 5px 18px rgba(49,74,55,.07)" }}>
                  {message.text}
                </div>
              ))}
              {typing && (
                <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-4 shadow-sm" aria-label="Melina está digitando">
                  {[0, 1, 2].map((dot) => <span key={dot} className="h-2 w-2 animate-bounce rounded-full bg-[#314A37]/45" style={{ animationDelay: `${dot * 160}ms` }} />)}
                </div>
              )}
              {step === questions.length && (
                <div className="rounded-2xl border border-[#314A37]/10 bg-white p-4 text-[#314A37] shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider">Resumo do seu evento</p>
                  <div className="mt-3 grid gap-2 text-xs font-semibold text-[#314A37]/70">
                    <p className="flex gap-2"><CalendarDays size={15} /> {answers.event} · {answers.date} · {answers.time}</p>
                    <p className="flex gap-2"><Users size={15} /> Aproximadamente {answers.guests} convidados</p>
                    <p>{answers.location}</p>
                    <p className="mt-1 rounded-xl px-3 py-2 font-black" style={{ background: `${ROSA}55`, color: VERDE }}>Sugestão da Melina: {suggestedPackage()}</p>
                  </div>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-black" style={{ background: ROSA, color: VERDE }}><MessageCircle size={18} /> Enviar para o WhatsApp</a>
                  <button type="button" onClick={restart} className="mt-3 w-full text-xs font-bold text-[#314A37]/55">Corrigir informações</button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {step < questions.length && (
            <form onSubmit={submit} className="border-t border-black/5 bg-white p-3">
              {error && <p className="mb-2 px-2 text-xs font-bold text-red-700">{error}</p>}
              <div className="flex items-end gap-2 rounded-2xl bg-[#314A37]/5 p-2 pl-4">
                <input disabled={typing} autoFocus value={input} onChange={(event) => { setInput(event.target.value); setError(""); }} inputMode="text" placeholder={typing ? "Melina está escrevendo..." : "Digite sua resposta..."} className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#314A37] outline-none placeholder:text-[#314A37]/35 disabled:cursor-wait" />
                <button disabled={typing} type="submit" aria-label="Enviar resposta" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white disabled:opacity-40" style={{ background: VERDE }}><Send size={17} /></button>
              </div>
            </form>
          )}
        </section>
      )}

      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex min-h-14 items-center gap-3 rounded-full px-5 font-black shadow-xl transition hover:-translate-y-0.5" style={{ background: open ? VERDE : ROSA, color: open ? "#fff" : VERDE }} aria-label={open ? "Minimizar assistente" : "Abrir assistente de orçamento"}>
        {open ? <ChevronDown size={22} /> : <MessageCircle size={23} />}
        <span className="text-sm">{open ? "Minimizar" : "Posso ajudar?"}</span>
      </button>
    </div>
  );
}
