import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { API_URL, fmt } from "./checkout";

export type PixPaymentRequest = {
  order: Record<string, unknown>;
  headers: Record<string, string>;
  resolve: (order: Record<string, unknown> | null) => void;
};

export function MercadoPagoPixModal({ request, onClose, autoCloseExpiredMs }: {
  request: PixPaymentRequest;
  onClose: () => void;
  /** Kiosk: close an expired charge on its own after this delay. */
  autoCloseExpiredMs?: number;
}) {
  const [qrImage, setQrImage] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);

  // Critical while Mercado Pago is generating or awaiting the charge; an expired
  // charge or a failed generation no longer holds the kiosk idle timer.
  const paymentActive = !expired && !(error && !qrImage);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("menfis-payment-active", { detail: paymentActive }));
  }, [paymentActive]);
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent("menfis-payment-active", { detail: false }));
  }, []);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!expired || autoCloseExpiredMs === undefined) return;
    const timer = setTimeout(() => { request.resolve(null); onCloseRef.current(); }, autoCloseExpiredMs);
    return () => clearTimeout(timer);
  }, [autoCloseExpiredMs, expired, request]);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/payments/pix/${encodeURIComponent(String(request.order.id))}/status`, {
          headers: request.headers, cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const order = await response.json();
        if (stopped) return;
        if (String(order.paymentStatus).toLowerCase() === "approved") {
          request.resolve(order);
          onClose();
          return;
        }
        if (["CANCELLED", "EXPIRED"].includes(String(order.status).toUpperCase())
          || ["failed", "rejected", "cancelled", "expired"].includes(String(order.paymentStatus).toLowerCase())) {
          setExpired(true);
          return;
        }
        setError("");
      } catch {
        if (stopped) return;
        setError("Não foi possível consultar o pagamento. Tentando novamente; não pague outra vez.");
      }
      if (!stopped) timer = setTimeout(poll, 5000);
    };
    const start = async () => {
      setError("");
      try {
        const response = await fetch(`${API_URL}/payments/pix`, {
          method: "POST", headers: { "Content-Type": "application/json", ...request.headers },
          body: JSON.stringify({ orderId: request.order.id }), signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(pixErrorMessage(data?.error));
        if (!data.qrCode && !data.qrCodeBase64) throw new Error("O Mercado Pago não devolveu o QR Code.");
        const image = data.qrCodeBase64
          ? `data:image/png;base64,${data.qrCodeBase64}`
          : await QRCode.toDataURL(data.qrCode, { width: 420, margin: 4 });
        if (stopped) return;
        setCode(data.qrCode || "");
        setQrImage(image);
        await poll();
      } catch (reason) {
        if (stopped) return;
        const detail = reason instanceof Error && reason.message ? ` ${reason.message}` : "";
        setError(`Não foi possível gerar o Pix no Mercado Pago.${detail}`);
      }
    };
    void start();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); };
  }, [request, attempt]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Pagamento Pix Mercado Pago"
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-white/95 p-5 text-[#65001f]">
      <div className="w-full max-w-lg rounded-3xl border border-pink-200 bg-white p-6 text-center shadow-xl">
        <h2 className="text-2xl font-black">Pagamento Pix</h2>
        <p className="mt-2 text-sm">Escaneie no aplicativo do seu banco.</p>
        <p className="mt-3 text-3xl font-black">{fmt(Number(request.order.total))}</p>
        {expired ? <p className="my-6 font-bold">Esta cobrança foi encerrada. Não efetue o pagamento.</p>
          : qrImage ? <img src={qrImage} alt="QR Code Pix gerado pelo Mercado Pago para este pedido"
            className="mx-auto my-4 aspect-square w-full max-w-80 object-contain" />
          : <p className="my-8" role="status">Gerando QR Code no Mercado Pago…</p>}
        {code && !expired && <button type="button" className="rounded-xl bg-[#65001f] px-6 py-3 font-bold text-white"
          onClick={() => { void navigator.clipboard.writeText(code).then(() => setCopied(true)).catch(() => setError("Não foi possível copiar. Escaneie o QR Code.")); }}>
          {copied ? "Código copiado" : "Copiar código Pix"}
        </button>}
        {qrImage && !expired && <p className="mt-4 text-sm" role="status">Aguardando confirmação automática do pagamento.</p>}
        {error && <p role="alert" className="mt-4 text-sm font-bold">{error}</p>}
        {error && !qrImage && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 rounded-xl border p-3 font-bold">Tentar novamente</button>}
        <button type="button" className="mt-5 block w-full text-sm underline" onClick={() => { request.resolve(null); onClose(); }}>
          Voltar sem confirmar pagamento
        </button>
      </div>
    </div>
  );
}

function pixErrorMessage(error: unknown) {
  const text = typeof error === "string" ? error : "";
  if (text.includes("mercado_pago_not_configured")) return "Credencial do Mercado Pago não configurada no servidor.";
  if (text.includes("mercado_pago_pix_failed:")) return `Motivo: ${text.split("mercado_pago_pix_failed:")[1].trim()}`;
  return text ? `Motivo: ${text}` : "Tente novamente.";
}
