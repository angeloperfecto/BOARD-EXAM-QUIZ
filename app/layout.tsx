import type {Metadata} from 'next';
import './globals.css'; // Global styles
import 'katex/dist/katex.min.css'; // Mathematical rendering styles

export const metadata: Metadata = {
  title: 'Electrical Review Pro',
  description: 'An intelligent review generator that automatically extracts questions, tables, and images from PDF and Word documents to create interactive quizzes.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
