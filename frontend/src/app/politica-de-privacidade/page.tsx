import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politica de Privacidade | Menfi's Burger",
  description:
    "Politica de Privacidade da Menfi's Burger: coleta, uso e protecao de dados para pedidos, entrega e atendimento.",
  alternates: {
    canonical: "/politica-de-privacidade",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Politica de Privacidade"
      description="Esta politica explica como a Menfi's Burger coleta e utiliza dados pessoais para operar pedidos, entregas, pagamentos e atendimento."
      sections={[
        {
          title: "Dados coletados",
          paragraphs: [
            "Podemos coletar nome, telefone, endereco de entrega, e-mail, dados dos pedidos realizados e informacoes necessarias para atendimento ao cliente.",
          ],
        },
        {
          title: "Uso dos dados",
          items: [
            "Processar pedidos feitos pelo site, WhatsApp, atendimento ou totem.",
            "Organizar entrega, retirada, confirmacao de pagamento e suporte ao cliente.",
            "Enviar comunicacoes sobre pedido, acompanhamento, recuperacao de acesso e atendimento.",
            "Melhorar a operacao, o cardapio, a seguranca e a experiencia do cliente.",
          ],
        },
        {
          title: "Servicos de terceiros",
          paragraphs: [
            "A Menfi's Burger pode utilizar WhatsApp, Meta/Facebook e Mercado Pago para comunicacao, atendimento, notificacoes, processamento de pagamentos e seguranca operacional.",
            "Esses servicos podem tratar dados conforme suas proprias politicas, sempre dentro da finalidade de atendimento, pedido, pagamento e suporte.",
          ],
        },
        {
          title: "Compartilhamento",
          paragraphs: [
            "Nao vendemos dados pessoais. O compartilhamento acontece apenas quando necessario para processar pedidos, realizar entregas, confirmar pagamentos, cumprir obrigacoes legais ou prestar suporte.",
          ],
        },
        {
          title: "Contato",
          paragraphs: [
            "Para duvidas sobre privacidade ou uso de dados, entre em contato pelo e-mail rodrigomuinhostattooist@gmail.com.",
          ],
        },
      ]}
    />
  );
}
