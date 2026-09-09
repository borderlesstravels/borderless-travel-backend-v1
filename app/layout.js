export const metadata = {
  title: "Borderless API",
  description: "Borderless Travels backend API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background:
            "radial-gradient(ellipse at top, #0f172a 0%, #020617 55%, #000 100%)",
          color: "#e2e8f0",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
