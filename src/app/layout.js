import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ChessReps - Opening Trainer',
  description: 'Master chess openings with spaced repetition',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-zinc-950">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
