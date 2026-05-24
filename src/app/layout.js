import './globals.css';

export const metadata = {
  title: 'Chessreps — Antigravity',
  description: 'Premium interactive chess opening trainer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
