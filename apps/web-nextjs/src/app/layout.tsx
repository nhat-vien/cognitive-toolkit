import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Equilibria (Mind Anchor) — CBT, TEAM-CBT, DBT & IPSRT Clinical Web Companion',
  description:
    'Evidence-based bilingual (Vietnamese/English) self-help & between-session companion for Anxiety, Depression, and Bipolar Disorder.',
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{props.children}</body>
    </html>
  );
}
