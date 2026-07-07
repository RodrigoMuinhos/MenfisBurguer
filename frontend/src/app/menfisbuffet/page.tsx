export const metadata = {
  title: "Menfis Buffet",
  description: "Area mobile-first para solicitar buffet Menfi's por WhatsApp.",
};

export default function MenfisBuffetPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        background: "#fff",
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      <iframe
        src="/menfisbuffet-static/index.html"
        title="Menfis Buffet"
        loading="eager"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
        }}
      />
    </main>
  );
}
