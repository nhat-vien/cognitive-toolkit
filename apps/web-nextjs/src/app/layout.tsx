import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Haven — Không Gian Bình Yên & Cân Bằng Tâm Trí',
  description:
    'Không gian lắng nghe, xoa dịu lo âu, vượt qua trầm cảm và cân bằng giấc ngủ mỗi ngày.',
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{props.children}</body>
    </html>
  );
}
