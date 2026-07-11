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
  guests: string;
  location: string;
};

type Message = { id: number; from: "bot" | "user"; text: string };

const questions = [
  "Antes de tudo, como posso te chamar?",
  "Prazer! Que tipo de evento você está planejando?",
  "Legal! Qual é a data prevista? Pode escrever, por exemplo, 20/08/2026.",
  "Para quantas pessoas, aproximadamente?",
  "E em qual bairro e cidade será o evento?",
];

const initialMessages: Message[] = [
  { id: 1, from: "bot", text: "Oi! Eu sou a assistente do Menfi's Buffet 👋" },
  { id: 2, from: "bot", text: "Posso adiantar seu orçamento em menos de 1 minuto. Antes de tudo, como posso te chamar?" },
];

export function BuffetAssistant() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [answers, setAnswers] = useState<Answers>({ name: "", event: "", date: "", guests: "", location: "" });
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
    if (value.length < 2) return "Me conta só mais um pouquinho para eu conseguir continuar.";
    if (step === 2 && !/^\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?$/.test(value) && !/[a-zá-ú]/i.test(value)) return "Informe uma data, como 20/08/2026, ou diga se ainda não decidiu.";
    if (step === 3) {
      const guests = Number(value.replace(/\D/g, ""));
      if (!guests || guests > 5000) return "Digite uma quantidade aproximada de convidados.";
    }
    return "";
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    const validation = validate(value);
    if (validation) return setError(validation);

    setError("");
    setInput("");
    addMessage("user", value);
    const fields: Array<keyof Answers> = ["name", "event", "date", "guests", "location"];
    const nextAnswers = { ...answers, [fields[step]]: value };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      const reply = step === 0 ? `Prazer, ${value}! 😊 ${questions[step + 1]}` : questions[step + 1];
      window.setTimeout(() => addMessage("bot", reply), 250);
      setStep(step + 1);
    } else {
      window.setTimeout(() => {
        addMessage("bot", `Perfeito, ${nextAnswers.name}! Já organizei as informações. Agora é só enviar para nossa equipe montar seu orçamento. 💚`);
        setStep(questions.length);
      }, 250);
    }
  };

  const whatsappUrl = () => {
    const text = [
      "Olá! Fiz uma prévia pelo assistente do Menfi's Buffet e gostaria de um orçamento:",
      `Nome: ${answers.name}`,
      `Evento: ${answers.event}`,
      `Data: ${answers.date}`,
      `Convidados: aproximadamente ${answers.guests}`,
      `Local: ${answers.location}`,
      "Podem me ajudar a escolher o melhor pacote?",
    ].join("\n");
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  };

  const restart = () => {
    setStep(0);
    setInput("");
    setError("");
    setAnswers({ name: "", event: "", date: "", guests: "", location: "" });
    setMessages(initialMessages);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl" aria-label="Assistente de orçamento Menfi's Buffet">
          <header className="flex items-center justify-between px-5 py-4 text-white" style={{ background: VERDE }}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: ROSA, color: VERDE }}><Sparkles size={19} /></span>
              <div><p className="text-sm font-black">Assistente Menfi's</p><p className="text-[11px] font-semibold text-white/65">Orçamento rápido para seu evento</p></div>
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
              {step === questions.length && (
                <div className="rounded-2xl border border-[#314A37]/10 bg-white p-4 text-[#314A37] shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider">Resumo do seu evento</p>
                  <div className="mt-3 grid gap-2 text-xs font-semibold text-[#314A37]/70">
                    <p className="flex gap-2"><CalendarDays size={15} /> {answers.event} · {answers.date}</p>
                    <p className="flex gap-2"><Users size={15} /> Aproximadamente {answers.guests} convidados</p>
                    <p>{answers.location}</p>
                  </div>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-black text-white" style={{ background: "#25D366" }}><MessageCircle size={18} /> Enviar para o WhatsApp</a>
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
                <input autoFocus value={input} onChange={(event) => { setInput(event.target.value); setError(""); }} inputMode={step === 3 ? "numeric" : "text"} placeholder={step === 3 ? "Ex.: 50 pessoas" : "Digite sua resposta..."} className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#314A37] outline-none placeholder:text-[#314A37]/35" />
                <button type="submit" aria-label="Enviar resposta" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: VERDE }}><Send size={17} /></button>
              </div>
            </form>
          )}
        </section>
      )}

      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex min-h-14 items-center gap-3 rounded-full px-5 font-black text-white shadow-xl transition hover:-translate-y-0.5" style={{ background: open ? VERDE : "#25D366" }} aria-label={open ? "Minimizar assistente" : "Abrir assistente de orçamento"}>
        {open ? <ChevronDown size={22} /> : <MessageCircle size={23} />}
        <span className="text-sm">{open ? "Minimizar" : "Posso ajudar?"}</span>
      </button>
    </div>
  );
}
