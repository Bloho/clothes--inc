import "./globals.css";

export const metadata = {
  title: "Clothes",
  description: "A minimal online wardrobe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
