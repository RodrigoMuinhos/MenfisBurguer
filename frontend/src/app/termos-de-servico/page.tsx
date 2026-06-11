import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de Servico | Menfi's Burger",
  description:
    "Termos de Servico da Menfi's Burger: regras de uso, pedidos, prazos, cancelamentos e responsabilidades do cliente.",
  alternates: {
    canonical: "/termos-de-servico",
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Termos"
      title="Termos de Servico"
      description="Ao utilizar o site, cardapio digital, checkout, WhatsApp ou atendimento da Menfi's Burger, o cliente concorda com estas regras de uso."
      sections={[
        {
          title: "Uso do sistema",
          paragraphs: [
            "O sistema Menfi's Burger permite consultar produtos, montar pedidos, informar dados de entrega ou retirada, escolher forma de pagamento e acompanhar o andamento do pedido.",
          ],
        },
        {
          title: "Pedidos e confirmacao",
          items: [
            "Pedidos estao sujeitos a confirmacao da equipe, disponibilidade de produtos, area de atendimento e validacao dos dados informados.",
            "A Menfi's Burger pode entrar em contato por telefone ou WhatsApp para confirmar informacoes antes de iniciar preparo ou entrega.",
            "Pedidos com pagamento online seguem a confirmacao do provedor de pagamento utilizado.",
          ],
        },
        {
          title: "Prazos",
          paragraphs: [
            "Os prazos exibidos para preparo, retirada ou entrega sao estimativas. Condicoes de producao, demanda, clima, transito e disponibilidade de entregadores podem alterar o tempo final.",
          ],
        },
        {
          title: "Cancelamentos",
          paragraphs: [
            "Solicitacoes de cancelamento estao sujeitas a analise. Pedidos ja confirmados, em preparo, prontos ou em rota podem nao ser cancelados automaticamente.",
          ],
        },
        {
          title: "Responsabilidade do cliente",
          items: [
            "Informar nome, telefone, endereco, complemento, forma de pagamento e observacoes corretamente.",
            "Estar disponivel para contato e recebimento do pedido.",
            "Conferir os itens antes de finalizar o pedido.",
          ],
        },
      ]}
    />
  );
}
