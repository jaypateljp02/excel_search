import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Excel Search — Find Anything Instantly',
  description:
    'Search across 72 Excel files instantly. Find any cell value, sheet, or row in seconds.',
  keywords: 'excel, search, spreadsheet, data, lookup',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>{children}</body>
    </html>
  );
}
