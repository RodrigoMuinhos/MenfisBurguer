import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Exclusao de Dados | Menfi's Burger",
  description:
    "Solicite a exclusao dos seus dados pessoais mantidos pela Menfi's Burger pelo e-mail de atendimento.",
  alternates: {
    canonical: "/exclusao-de-dados",
  },
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      eyebrow="Dados pessoais"
      title="Exclusao de Dados"
      description="O cliente pode solicitar a exclusao dos seus dados pessoais armazenados pela Menfi's Burger, conforme as regras aplicaveis e necessidades legais ou operacionais."
      sections={[
        {
          title: "Como solicitar",
          paragraphs: [
            "Envie um e-mail para rodrigomuinhostattooist@gmail.com informando seu nome, telefone cadastrado e que deseja solicitar a exclusao dos seus dados pessoais.",
          ],
        },
        {
          title: "Prazo de atendimento",
          paragraphs: [
            "A solicitacao sera analisada e respondida em ate 15 dias. Podemos solicitar informacoes adicionais para confirmar a identidade do solicitante e proteger a seguranca da conta.",
          ],
        },
        {
          title: "Dados que podem ser excluidos",
          items: [
            "Dados de perfil, como nome, telefone, e-mail e endereco salvo.",
            "Dados usados para comunicacao e atendimento, quando nao houver obrigacao de retencao.",
            "Informacoes de relacionamento associadas ao cadastro do cliente.",
          ],
        },
        {
          title: "Retencao necessaria",
          paragraphs: [
            "Alguns registros de pedidos, pagamentos, suporte ou auditoria podem ser mantidos pelo periodo necessario para cumprimento de obrigacoes legais, prevencao de fraude, controle financeiro e defesa de direitos.",
          ],
        },
      ]}
    />
  );
}
